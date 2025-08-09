"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(3, "Enter a title with at least 3 characters"),
  method: z.enum(["refinement_poker", "business_value"]),
  teamName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9\- ]*$/, "Use lowercase letters, numbers, or spaces")
    .optional()
    .or(z.literal("")),
  joinCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Use a six digit code")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function RadioCard({
  value,
  selected,
  title,
  subtitle,
  registerName,
}: {
  value: "refinement_poker" | "business_value";
  selected: boolean;
  title: string;
  subtitle: string;
  registerName: any;
}) {
  return (
    <label
      className={`radio block rounded-xl p-4 border transition ${
        selected ? "ring-2 ring-offset-0" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input type="radio" value={value} {...registerName} className="radio mt-1" />
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm helper">{subtitle}</div>
        </div>
      </div>
    </label>
  );
}

export default function SessionForm() {
  const router = useRouter();
  const { register, handleSubmit, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: "refinement_poker",
      title: "",
      teamName: "",
      joinCode: "",
    },
    mode: "onChange",
  });

  const { errors, isValid, isSubmitting } = formState;
  const method = watch("method");

  const onSubmit = async (values: FormValues) => {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      alert("Could not create session");
      return;
    }

    const data = await res.json();
    router.push(data.joinUrl ?? `/session/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-describedby="form-help">
      <div className="space-y-2">
        <label htmlFor="title" className="label text-sm font-medium">Session Title</label>
        <input
          id="title"
          type="text"
          autoComplete="off"
          {...register("title")}
          className="input w-full rounded-lg px-3 py-2"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && <p id="title-error" className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="label text-sm font-medium mb-1">Choose a method</legend>

        <RadioCard
          value="refinement_poker"
          selected={method === "refinement_poker"}
          title="Refinement Poker"
          subtitle="Relative estimation with cards and a short converge step"
          registerName={register("method")}
        />

        <RadioCard
          value="business_value"
          selected={method === "business_value"}
          title="Business Value Sizing"
          subtitle="Affinity based grouping around value bands"
          registerName={register("method")}
        />

        {errors.method && <p className="text-sm text-red-500">{errors.method.message}</p>}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="teamName" className="label text-sm font-medium">Team Name</label>
        <input
          id="teamName"
          type="text"
          placeholder="optional"
          {...register("teamName")}
          className="input w-full rounded-lg px-3 py-2"
          aria-invalid={!!errors.teamName}
          aria-describedby={errors.teamName ? "teamName-error" : "teamName-help"}
        />
        {errors.teamName ? (
          <p id="teamName-error" className="text-sm text-red-500">{errors.teamName.message}</p>
        ) : (
          <p id="teamName-help" className="text-sm helper">Optional. Lowercase letters, numbers, or spaces. Used in the share URL.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="joinCode" className="label text-sm font-medium">Join Code</label>
        <input
          id="joinCode"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          placeholder="optional"
          {...register("joinCode")}
          className="input w-full rounded-lg px-3 py-2"
          aria-invalid={!!errors.joinCode}
          aria-describedby={errors.joinCode ? "join-error" : "join-help"}
        />
        {errors.joinCode ? (
          <p id="join-error" className="text-sm text-red-500">{errors.joinCode.message}</p>
        ) : (
          <p id="join-help" className="text-sm helper">Optional. Six digits for quick entry when joining.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="btn-primary w-full rounded-lg py-2"
        aria-live="polite"
      >
        {isSubmitting ? "Creating..." : "Create Session"}
      </button>

      <p id="form-help" className="sr-only">All fields are labeled and errors appear under each field.</p>
    </form>
  );
}


