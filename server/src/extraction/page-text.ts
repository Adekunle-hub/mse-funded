import { parse } from 'node-html-parser';

const NOISE = 'script, style, noscript, svg, iframe, form, nav, header, footer';
const STUDY_WORDS = /\b(ph\.?d|dphil|doctoral|doctorate|msc|m\.sc|masters?|master's|postgraduate|graduate|studentships?)\b/i;
const FUNDING_WORDS = /\b(scholarships?|studentships?|fellowships?|assistantships?|bursary|bursaries|funded|funding|stipend|tuition|salary|grant)\b/i;

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

export const NO_FUNDED_STUDY = 'The page does not mention funded MSc or PhD study';

export function mentionsFundedStudy(text: string): boolean {
  return STUDY_WORDS.test(text) && FUNDING_WORDS.test(text);
}
