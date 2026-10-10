import { parse } from 'node-html-parser';

const POST_WORDS = /\b(phd|ph\.d|dphil|doctoral|studentships?|msc|masters?|scholarships?|assistantships?|funded)\b/i;

export type FoundLink = { url: string; name: string };

export function findPostLinks(html: string, pageUrl: string): FoundLink[] {
  const page = new URL(pageUrl);
  const found = new Map<string, FoundLink>();

  for (const anchor of parse(html).querySelectorAll('a[href]')) {
    const name = anchor.text.replace(/\s+/g, ' ').trim();
    let url: URL;
    try {
      url = new URL(anchor.getAttribute('href') ?? '', page);
    } catch {
      continue;
    }

    url.hash = '';
    const sameSite = url.hostname === page.hostname;
    const looksLikePost = POST_WORDS.test(name) || POST_WORDS.test(url.pathname.replace(/[-_/]/g, ' '));

    if (sameSite && looksLikePost && url.href !== page.href && !found.has(url.href)) {
      found.set(url.href, { url: url.href, name: (name || url.pathname).slice(0, 200) });
    }
  }

  return [...found.values()];
}
