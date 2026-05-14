"use client";

import { useEffect } from "react";

const COOKIE = "trace_tz";

export function TzCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${COOKIE}=`))
        ?.slice(COOKIE.length + 1);
      if (current === tz) return;
      // 1 year, root path, lax so it travels with navigations
      document.cookie = `${COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);
  return null;
}
