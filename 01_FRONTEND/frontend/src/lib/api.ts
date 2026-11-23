// Typed fetch layer over the FastAPI backend. Base is the relative "/api" prefix so the
// same code works in dev (Vite proxies /api → :8001) and behind a single origin in prod.
const BASE = "/api";

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;
type ExtraHeaders = Record<string, string>;

async function request<T>(
  method: string,
  path: string,
  body?: JsonBody,
  extraHeaders?: ExtraHeaders,
): Promise<T> {
  // Session auth (if any) rides the httpOnly cookie automatically — never add token headers here.
  // `extraHeaders` is for app-level gates only (e.g. the admin console's X-Admin-Key passcode).
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(extraHeaders ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // FastAPI reports request-validation failures as 422 with a {detail: [...]} body.
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string, headers?: ExtraHeaders) => request<T>("GET", path, undefined, headers);
export const apiPost = <T>(path: string, body?: JsonBody, headers?: ExtraHeaders) =>
  request<T>("POST", path, body ?? null, headers);
export const apiPut = <T>(path: string, body?: JsonBody, headers?: ExtraHeaders) =>
  request<T>("PUT", path, body ?? null, headers);
export const apiPatch = <T>(path: string, body?: JsonBody, headers?: ExtraHeaders) =>
  request<T>("PATCH", path, body ?? null, headers);
export const apiDelete = <T>(path: string, headers?: ExtraHeaders) =>
  request<T>("DELETE", path, undefined, headers);
