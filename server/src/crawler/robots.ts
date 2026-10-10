import robotsParserModule from 'robots-parser';

const robotsParser = robotsParserModule as unknown as typeof robotsParserModule.default;

export type RobotsVerdict = 'allowed' | 'blocked' | 'unreachable';

export async function checkRobots(pageUrl: string, userAgent: string, timeoutMs: number): Promise<RobotsVerdict> {
  const robotsUrl = new URL('/robots.txt', pageUrl).toString();

  try {
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 400 && response.status < 500) return 'allowed';
    if (!response.ok) return 'unreachable';

    const robots = robotsParser(robotsUrl, await response.text());
    return robots.isAllowed(pageUrl, userAgent) === false ? 'blocked' : 'allowed';
  } catch {
    return 'unreachable';
  }
}
