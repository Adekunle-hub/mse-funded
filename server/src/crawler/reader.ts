import { pageText } from '../extraction/page-text.js';

export const READER_CONTENT_TYPE = 'text/markdown';

const MIN_TEXT_CHARS = 300;

export function needsReader(html: string): boolean {
  return /<script/i.test(html) && pageText(html).length < MIN_TEXT_CHARS;
}

export async function readWithJina(url: string, apiKey: string | undefined): Promise<string | null> {
  const headers: Record<string, string> = { 'X-Return-Format': 'markdown' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, { headers, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return null;
    const text = (await response.text()).trim();
    return text.length >= MIN_TEXT_CHARS ? text : null;
  } catch {
    return null;
  }
}
