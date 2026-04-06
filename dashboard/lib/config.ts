const rawBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

/** Base URL for all REST API calls, e.g. http://127.0.0.1:8000 */
export const API_BASE = rawBase;

/**
 * Returns the WebSocket URL for the live feed endpoint.
 * Converts http(s) → ws(s) automatically.
 */
export function getWsUrl(): string {
  const wsBase = rawBase.replace(/^http/, "ws");
  return `${wsBase}/ws`;
}

/**
 * Returns the URL to fetch an alert snapshot image from the backend.
 * @param imagePath - The image_path value stored in the alerts table
 *                    (e.g. "alerts/abc123.jpg")
 */
export function alertImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  // Backend mounts /alerts as a static directory at /alerts
  const filename = imagePath.split(/[\\/]/).pop() ?? imagePath;
  return `${API_BASE}/alerts/${filename}`;
}
