export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function buildApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  // Ensure single slash between base and path
  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return path;
}

export function apiFetch(inputPath: string, init?: RequestInit): Promise<Response> {
  const url = buildApiUrl(inputPath);
  return fetch(url, init);
}

