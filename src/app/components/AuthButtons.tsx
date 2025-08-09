"use client";
import { signIn, signOut, useSession } from 'next-auth/react';

export function AuthButtons() {
  const { data } = useSession();
  const user = data?.user;
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <span className="text-sm text-gray-600">{user.name ?? user.email}</span>
          <button className="rounded border px-3 py-1" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
        </>
      ) : (
        <button className="rounded border px-3 py-1" onClick={() => signIn(undefined, { callbackUrl: '/' })}>Sign in</button>
      )}
    </div>
  );
}


