const rawBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8001";

export const API_BASE = rawBase;

export function getWsUrl(): string {
  return `${rawBase.replace(/^http/, "ws")}/ws`;
}
