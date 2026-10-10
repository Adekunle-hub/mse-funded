import { parse } from 'node-html-parser';

const NOISE = 'script, style, noscript, svg, iframe, form, nav, header, footer';

export function pageText(html: string): string {
  const root = parse(html);
  const title = root.querySelector('title')?.text.trim() ?? '';
  const content = root.querySelector('main') ?? root.querySelector('body') ?? root;

  for (const element of content.querySelectorAll(NOISE)) element.remove();

  const text = content.structuredText
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return title ? `${title}\n\n${text}` : text;
}
