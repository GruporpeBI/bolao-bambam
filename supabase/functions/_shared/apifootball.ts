/**
 * API-Football helper — dual-key with automatic fallback.
 *
 * Tries API_FOOTBALL_KEY first. If it returns 429 (rate-limit) or the
 * remaining-requests header reaches 0, retries with API_FOOTBALL_KEY_2.
 */

export async function fetchAf(url: string): Promise<Response> {
  const key1 = Deno.env.get("API_FOOTBALL_KEY") ?? "";
  const key2 = Deno.env.get("API_FOOTBALL_KEY_2") ?? "";

  const tryFetch = (key: string) =>
    fetch(url, { headers: { "x-apisports-key": key } });

  const res1 = await tryFetch(key1);

  // Switch to key2 if: rate limited (429), or quota exhausted (remaining = 0)
  const remaining1 = Number(res1.headers.get("x-ratelimit-requests-remaining") ?? "1");
  if ((res1.status === 429 || remaining1 === 0) && key2) {
    console.warn("[apifootball] key1 rate-limited — switching to key2");
    return tryFetch(key2);
  }

  return res1;
}

export async function fetchAfJson<T = unknown>(url: string): Promise<T> {
  const res = await fetchAf(url);
  if (!res.ok) throw new Error(`API-Football HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}
