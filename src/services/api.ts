export interface UrlRecordOutput {
  url_converted: string;
  exp: string;
}

export interface UrlRecord {
  id: string;
  short_code: string;
  old_url: string;
  create_at: string;
  exp: number;
}

let BASE_URL = localStorage.getItem('api_base_url') || 'http://localhost:8080';

export function getBaseUrl(): string {
  return BASE_URL;
}

export function setBaseUrl(url: string): void {
  BASE_URL = url.replace(/\/$/, '');
  localStorage.setItem('api_base_url', BASE_URL);
}

export async function shortenUrl(url: string): Promise<UrlRecordOutput> {
  const response = await fetch(`${BASE_URL}/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<UrlRecordOutput>;
}

export async function listUrls(): Promise<UrlRecord[]> {
  const response = await fetch(`${BASE_URL}/urls`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<UrlRecord[]>;
}
