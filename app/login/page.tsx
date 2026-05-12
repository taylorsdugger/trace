"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, Card, Display, Body, Btn, Input, TraceLogo } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Incorrect password.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <Screen style={{ justifyContent: "center", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <TraceLogo size={42} />
        <Display size={32} style={{ marginTop: 4 }}>
          Welcome back.
        </Display>
        <Body soft size={14}>
          CBT journal with memory.
        </Body>
      </div>
      <Card style={{ padding: 18 }}>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            autoFocus
          />
          {error && (
            <Body size={13} style={{ color: "var(--color-accent)" }}>
              {error}
            </Body>
          )}
          <Btn primary type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Btn>
        </form>
      </Card>
    </Screen>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Screen />}>
      <LoginForm />
    </Suspense>
  );
}
