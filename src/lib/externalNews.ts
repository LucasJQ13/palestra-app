import { CatholicNewsConfig, CatholicNewsSourceKey, defaultCatholicNewsConfig } from './runtimeConfig';

export type ExternalCatholicNewsItem = {
  id: string;
  title: string;
  source: string;
  link: string;
  imageUrl?: string;
  publishedAt?: string;
};

type CatholicNewsSource = {
  key: CatholicNewsSourceKey;
  source: string;
  url: string;
  kind: 'rss' | 'html';
};

const catholicNewsSources: CatholicNewsSource[] = [
  { key: 'vatican', source: 'Vatican News', url: 'https://www.vaticannews.va/es.rss.xml', kind: 'rss' },
  { key: 'episcopado', source: 'Episcopado Argentino', url: 'https://episcopado.org/novedades', kind: 'html' },
  { key: 'aci', source: 'ACI Prensa', url: 'https://www.aciprensa.com/rss/noticias.xml', kind: 'rss' }
];

function stripCdata(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function decodeXml(value: string) {
  return stripCdata(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanText(value: string) {
  return decodeXml(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function readImage(xml: string) {
  const enclosure = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const media = xml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const mediaThumb = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const imageUrlAttr = xml.match(/<image[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const imageTag = readTag(xml, 'image');
  const url = enclosure || media || mediaThumb || imageUrlAttr || imageTag || undefined;
  return url ? decodeXml(url) : undefined;
}

function absoluteUrl(url: string, baseUrl: string) {
  if (!url) {
    return '';
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return new URL(url, baseUrl).toString();
}

function parseRssItems(xml: string, feed: CatholicNewsSource, limit: number): ExternalCatholicNewsItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, limit).flatMap((item, index) => {
    const title = readTag(item, 'title');
    const link = readTag(item, 'link') || item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
    if (!title || !link) {
      return [];
    }
    return [{
      id: `${feed.key}-${index}-${link}`,
      title,
      source: feed.source,
      link: absoluteUrl(link, feed.url),
      imageUrl: readImage(item),
      publishedAt: readTag(item, 'pubDate')
    }];
  });
}

function stripHtml(value: string) {
  return cleanText(value);
}

function parseEpiscopadoItems(html: string, feed: CatholicNewsSource, limit: number): ExternalCatholicNewsItem[] {
  const results: ExternalCatholicNewsItem[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a[^>]+href=["']([^"']*(?:\/ver\/|ver\/)\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) && results.length < limit) {
    const link = absoluteUrl(match[1], feed.url);
    const title = stripHtml(match[2]);
    if (!title || title.length < 8 || seen.has(link)) {
      continue;
    }
    const nearby = html.slice(match.index, Math.min(html.length, match.index + 900));
    const date = nearby.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0];
    const image = nearby.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    seen.add(link);
    results.push({
      id: `${feed.key}-${results.length}-${link}`,
      title,
      source: feed.source,
      link,
      imageUrl: image ? absoluteUrl(image, feed.url) : undefined,
      publishedAt: date
    });
  }

  return results;
}

export async function fetchExternalCatholicNews(config: CatholicNewsConfig = defaultCatholicNewsConfig): Promise<ExternalCatholicNewsItem[]> {
  if (!config.enabled) {
    return [];
  }

  const bySource: ExternalCatholicNewsItem[][] = [];
  const sourceLimit = 2;
  const orderedSources = config.sourceOrder
    .map((sourceKey) => catholicNewsSources.find((source) => source.key === sourceKey))
    .filter((source): source is CatholicNewsSource => Boolean(source))
    .filter((source) => config.sources[source.key] !== false);

  for (const feed of orderedSources) {
    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      const sourceItems = feed.kind === 'rss'
        ? parseRssItems(text, feed, Math.max(config.maxItems, sourceLimit))
        : parseEpiscopadoItems(text, feed, Math.max(config.maxItems, sourceLimit));
      if (sourceItems.length > 0) {
        bySource.push(sourceItems);
      }
    } catch {
      // Fuentes externas opcionales: la app debe seguir estable aunque una falle.
    }
  }

  const balanced: ExternalCatholicNewsItem[] = [];
  bySource.forEach((items) => balanced.push(...items.slice(0, sourceLimit)));
  if (balanced.length < config.maxItems) {
    bySource.forEach((items) => {
      items.slice(sourceLimit).forEach((item) => {
        if (balanced.length < config.maxItems && !balanced.some((current) => current.link === item.link)) {
          balanced.push(item);
        }
      });
    });
  }

  return balanced.slice(0, Math.min(config.maxItems, 6));
}
