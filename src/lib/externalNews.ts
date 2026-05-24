export type ExternalCatholicNewsItem = {
  id: string;
  title: string;
  source: string;
  link: string;
  imageUrl?: string;
  publishedAt?: string;
};

const catholicNewsFeeds = [
  {
    source: 'Vatican News',
    url: 'https://www.vaticannews.va/es.rss.xml'
  }
];

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function decodeXml(value: string) {
  return stripCdata(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function readImage(xml: string) {
  const enclosure = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const media = xml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const image = xml.match(/<image[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  return enclosure || media || image || undefined;
}

export async function fetchExternalCatholicNews(): Promise<ExternalCatholicNewsItem[]> {
  const results: ExternalCatholicNewsItem[] = [];

  for (const feed of catholicNewsFeeds) {
    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        continue;
      }
      const xml = await response.text();
      const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
      items.slice(0, 3).forEach((item, index) => {
        const title = readTag(item, 'title');
        const link = readTag(item, 'link');
        if (!title || !link) {
          return;
        }
        results.push({
          id: `${feed.source}-${index}-${link}`,
          title,
          source: feed.source,
          link,
          imageUrl: readImage(item),
          publishedAt: readTag(item, 'pubDate')
        });
      });
    } catch {
      // Fuente externa opcional: la app debe seguir estable aunque el RSS falle.
    }
  }

  return results.slice(0, 3);
}
