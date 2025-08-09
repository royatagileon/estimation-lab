import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getDeckValues } from '@/lib/deck';
import { canFinalize, summarizeReasons, validateVote } from '@/lib/rules';
import { embedText, cosineSimilarity } from '@/lib/embeddings';
import { rateLimitKey } from './ratelimit';

const t = initTRPC.context<Context>().create({ transformer: superjson });

function resolveBaseUrl(ctx: Context): string {
  const proto = ctx.headers.get('x-forwarded-proto') || 'http';
  const host = ctx.headers.get('x-forwarded-host') || ctx.headers.get('host');
  if (host) return `${proto}://${host}`;
  return process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next();
});

export const appRouter = t.router({
  health: t.procedure.query(() => ({ ok: true })),

  currentUser: t.procedure.query(({ ctx }) => ({ user: ctx.session?.user ?? null })),

    getSession: t.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const session = await ctx.prisma.session.findUnique({
          where: { id: input.id },
          include: {
            participants: true,
          },
        });
        if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
        const base = resolveBaseUrl(ctx);
        const shareLink = `${base}/join/${session.shareSlug}`;
        return {
          id: session.id,
          title: session.title,
          deckType: session.deckType,
          shareLink,
          joinCode: session.code,
          participants: session.participants.map((p) => ({ id: p.id, name: p.guestName ?? null, userId: p.userId })),
        };
      }),

  createSession: t.procedure
    .use(isAuthed)
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string().min(1),
         deckType: z.enum(['FIBONACCI', 'TSHIRT', 'CUSTOM']).default('FIBONACCI'),
        privacy: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const code = (Math.floor(100000 + Math.random() * 900000)).toString();
      const shareSlug = nanoid(8);
      const session = await ctx.prisma.session.create({
        data: {
          workspaceId: input.workspaceId,
          title: input.title,
          code,
          shareSlug,
          deckType: input.deckType as any,
          createdBy: ctx.session!.user.id,
        },
      });
      // creator becomes facilitator participant
      const facilitator = await ctx.prisma.participant.create({
        data: {
          sessionId: session.id,
          userId: ctx.session!.user.id,
          isFacilitator: true,
        },
      });
      const base = resolveBaseUrl(ctx);
      const link = `${base}/join/${shareSlug}`;
      return { id: session.id, participantId: facilitator.id, shareLink: link, joinCode: code };
    }),

  joinSessionByCode: t.procedure
    .input(z.object({ code: z.string().length(6), displayName: z.string().min(1).optional() }))
    .mutation(async ({ ctx, input }) => {
      const rl = rateLimitKey(`join:${input.code}:${ctx.headers.get('x-forwarded-for') ?? 'local'}`);
      if (!rl.ok) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
      const session = await ctx.prisma.session.findUnique({ where: { code: input.code } });
      if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
      let participantName: string | undefined = undefined;
      let userId: string | undefined = undefined;
      if (ctx.session?.user) {
        userId = ctx.session.user.id;
        participantName = ctx.session.user.name ?? ctx.session.user.email ?? 'Member';
      } else {
        participantName = input.displayName ?? 'Guest';
      }
      const participant = await ctx.prisma.participant.create({
        data: {
          sessionId: session.id,
          userId,
          guestName: userId ? null : participantName,
        },
      });
      return { sessionId: session.id, participantId: participant.id, shareSlug: session.shareSlug };
    }),

  joinSessionBySlug: t.procedure
    .input(z.object({ slug: z.string().min(4), displayName: z.string().min(1).optional() }))
    .mutation(async ({ ctx, input }) => {
      const rl = rateLimitKey(`join:${input.slug}:${ctx.headers.get('x-forwarded-for') ?? 'local'}`);
      if (!rl.ok) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
      const session = await ctx.prisma.session.findUnique({ where: { shareSlug: input.slug } });
      if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
      let participantName: string | undefined = undefined;
      let userId: string | undefined = undefined;
      if (ctx.session?.user) {
        userId = ctx.session.user.id;
        participantName = ctx.session.user.name ?? ctx.session.user.email ?? 'Member';
      } else {
        participantName = input.displayName ?? 'Guest';
      }
      const participant = await ctx.prisma.participant.create({
        data: {
          sessionId: session.id,
          userId,
          guestName: userId ? null : participantName,
        },
      });
      return { sessionId: session.id, participantId: participant.id, shareSlug: session.shareSlug };
    }),

  addWorkItem: t.procedure
    .use(isAuthed)
    .input(
      z.object({
        sessionId: z.string(),
        externalKey: z.string().optional(),
        title: z.string().min(1),
        description: z.string().min(1),
        acceptanceCriteria: z.string().optional(),
        tags: z.array(z.string()).default([]),
        domain: z.string().optional(),
        source: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wi = await ctx.prisma.workItem.create({ data: input });
      const text = `${input.title}\n${input.description}\n${input.acceptanceCriteria ?? ''}`;
      const vector = await embedText(text);
      await ctx.prisma.insight.create({
        data: {
          workItemId: wi.id,
          vector,
          similarWorkItemIds: [],
          tags: input.tags,
        },
      });
      return { id: wi.id };
    }),

  startRound: t.procedure
    .use(isAuthed)
    .input(z.object({ workItemId: z.string(), roundNumber: z.number().int().positive().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const round = await ctx.prisma.round.create({
        data: { workItemId: input.workItemId, roundNumber: input.roundNumber, status: 'IN_PROGRESS' },
      });
      return { roundId: round.id };
    }),

  castVote: t.procedure
    .input(z.object({ roundId: z.string(), participantId: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const round = await ctx.prisma.round.findUnique({ where: { id: input.roundId }, include: { workItem: { include: { session: true } } } });
      if (!round) throw new TRPCError({ code: 'NOT_FOUND' });
      const deck = getDeckValues(round.workItem.session.deckType as any);
      if (!validateVote(deck, input.value)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid vote' });
      const vote = await ctx.prisma.vote.upsert({
        where: { roundId_participantId: { roundId: input.roundId, participantId: input.participantId } },
        create: { roundId: input.roundId, participantId: input.participantId, value: input.value },
        update: { value: input.value },
      });
      return { id: vote.id };
    }),

  revealVotes: t.procedure
    .use(isAuthed)
    .input(z.object({ roundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.round.update({ where: { id: input.roundId }, data: { revealedAt: new Date(), status: 'REVEALED' } });
      return { ok: true };
    }),

  addReason: t.procedure
    .input(z.object({ roundId: z.string(), participantId: z.string(), polarity: z.enum(['HIGH', 'LOW']), text: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const text = input.text.trim();
      const reason = await ctx.prisma.reason.upsert({
        where: { roundId_participantId_polarity: { roundId: input.roundId, participantId: input.participantId, polarity: input.polarity as any } },
        create: { roundId: input.roundId, participantId: input.participantId, polarity: input.polarity as any, text },
        update: { text },
      });
      return { id: reason.id };
    }),

  raiseObjection: t.procedure
    .input(z.object({ roundId: z.string(), participantId: z.string(), text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const obj = await ctx.prisma.objection.create({ data: input });
      return { id: obj.id };
    }),

  callRevote: t.procedure
    .use(isAuthed)
    .input(z.object({ workItemId: z.string(), nextRoundNumber: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const round = await ctx.prisma.round.create({
        data: { workItemId: input.workItemId, roundNumber: input.nextRoundNumber, status: 'IN_PROGRESS' },
      });
      return { roundId: round.id };
    }),

  finalizeDecision: t.procedure
    .use(isAuthed)
    .input(z.object({
      workItemId: z.string(),
      decidedBy: z.string(),
      value: z.string(),
      businessValue: z.string().optional(),
      summaryNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure reasons for outliers
      const lastRound = await ctx.prisma.round.findFirst({
        where: { workItemId: input.workItemId },
        orderBy: { roundNumber: 'desc' },
        include: { votes: true, workItem: { include: { session: true } }, reasons: true },
      });
      if (!lastRound) throw new TRPCError({ code: 'BAD_REQUEST' });
      const deck = getDeckValues(lastRound.workItem.session.deckType as any);
      const participantIdToVote: Record<string, string> = {};
      for (const v of lastRound.votes) participantIdToVote[v.participantId] = v.value;
      const participantIdToReasons: Record<string, { HIGH?: string; LOW?: string }> = {};
      for (const r of lastRound.reasons) {
        participantIdToReasons[r.participantId] ??= {};
        participantIdToReasons[r.participantId][r.polarity as 'HIGH' | 'LOW'] = r.text;
      }
      const { ok, missingReasons } = canFinalize({ deck, participantIdToVote, participantIdToReasons });
      if (!ok) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Missing reasons for: ${missingReasons.join(',')}` });

      const fd = await ctx.prisma.finalDecision.upsert({
        where: { workItemId: input.workItemId },
        create: { workItemId: input.workItemId, value: input.value, businessValue: input.businessValue, decidedBy: input.decidedBy, summaryNotes: input.summaryNotes },
        update: { value: input.value, businessValue: input.businessValue, summaryNotes: input.summaryNotes },
      });

      // record short summary on insight
      const summary = summarizeReasons(participantIdToReasons);
      await ctx.prisma.insight.create({
        data: {
          workItemId: input.workItemId,
          suggestedValue: input.value,
          similarityScore: null,
          similarWorkItemIds: [],
          tags: [],
          modelVersion: 'rules-1',
          vector: [],
        },
      }).catch(() => {});

      return { id: fd.id, summary };
    }),

  getSuggestion: t.procedure
    .input(z.object({ workItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const wi = await ctx.prisma.workItem.findUnique({ where: { id: input.workItemId }, include: { session: true } });
      if (!wi) throw new TRPCError({ code: 'NOT_FOUND' });
      const thisInsight = await ctx.prisma.insight.findFirst({ where: { workItemId: wi.id }, orderBy: { createdAt: 'desc' } });
      if (!thisInsight || !thisInsight.vector?.length) return { suggestedValue: null, similar: [] as any[], explanation: 'No embedding yet' };

      const others = await ctx.prisma.insight.findMany({
        where: { workItem: { sessionId: wi.sessionId }, NOT: { workItemId: wi.id }, vector: { isEmpty: false } },
        include: { workItem: { include: { finalDecision: true } } },
        take: 100,
      });
      const scores = others
        .filter((o) => o.vector && o.vector.length === thisInsight.vector.length)
        .map((o) => ({ o, s: cosineSimilarity(thisInsight.vector as number[], o.vector as number[]) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 5);
      const similar = scores.map(({ o, s }) => ({ id: o.workItemId, title: o.workItem.title, value: o.workItem.finalDecision?.value ?? null, score: s }));
      const deck = getDeckValues(wi.session.deckType as any);
      // const values = similar.map((x) => Number(x.value ?? 0));
      const sumScores = scores.reduce((a, b) => a + b.s, 0) || 1;
      const weighted = scores.reduce((acc, cur) => acc + (Number(cur.o.workItem.finalDecision?.value ?? 0) * cur.s), 0) / sumScores;
      const suggestedValue = isFinite(weighted) && weighted > 0 ? `${nearest(deck, weighted)}` : null;
      function nearest(deck: string[], n: number) {
        return deck.reduce((prev, curr) => (Math.abs(Number(curr) - n) < Math.abs(Number(prev) - n) ? curr : prev), deck[0]);
      }
      const explanation = similar.length
        ? `Similar to ${similar.filter((s) => s.value).length} items; top values: ${similar
            .filter((s) => s.value)
            .slice(0, 3)
            .map((s) => s.value)
            .join(', ')}`
        : 'No similar items yet';
      return { suggestedValue, similar, explanation };
    }),

  importCsv: t.procedure
    .use(isAuthed)
    .input(z.object({ sessionId: z.string(), rows: z.array(z.record(z.string(), z.string().nullable())).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.$transaction(
        input.rows.map((r) =>
          ctx.prisma.workItem.create({
            data: {
              sessionId: input.sessionId,
              externalKey: r.externalKey ?? undefined,
              title: r.title ?? '',
              description: r.description ?? '',
              acceptanceCriteria: r.acceptanceCriteria ?? undefined,
              tags: r.tags ? r.tags.split(',').map((x) => x.trim()).filter(Boolean) : [],
              domain: r.domain ?? undefined,
              source: r.source ?? 'CSV',
            },
          }),
        ),
      );
      return { count: created.length };
    }),

  exportCsv: t.procedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.workItem.findMany({
        where: { sessionId: input.sessionId },
        include: { finalDecision: true, rounds: { include: { reasons: true, objections: true } } },
      });
      const csvRows = rows.map((r) => ({
        externalKey: r.externalKey ?? '',
        title: r.title,
        description: r.description,
        acceptanceCriteria: r.acceptanceCriteria ?? '',
        tags: r.tags.join(','),
        domain: r.domain ?? '',
        finalValue: r.finalDecision?.value ?? '',
        reasonsSummary: r.rounds.flatMap((ro) => ro.reasons.map((x) => x.text)).join(' | '),
        objectionCount: r.rounds.reduce((a, b) => a + b.objections.length, 0),
        transcriptLink: `${resolveBaseUrl(ctx)}/session/${r.sessionId}`,
      }));
      const headers = Object.keys(csvRows[0] ?? { title: '' });
      const csv = [headers.join(','), ...csvRows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','))].join('\n');
      return { csv };
    }),
});

export type AppRouter = typeof appRouter;


