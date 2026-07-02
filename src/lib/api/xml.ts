export type DataSource = "live" | "mock";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
  message?: string;
}

export function getXmlText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

export function getXmlItems(xml: string): Record<string, string>[] {
  const itemsMatch = xml.match(/<items>([\s\S]*?)<\/items>/);
  if (!itemsMatch) return [];

  const itemMatches = [...itemsMatch[1].matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return itemMatches.map((match) => {
    const itemXml = match[1];
    const fields = [
      "applicationNumber",
      "inventionTitle",
      "applicantName",
      "applicationDate",
      "registerStatus",
      "ipcNumber",
      "astrtCont",
      "registerNumber",
      "openNumber",
    ];

    const result: Record<string, string> = {};
    for (const field of fields) {
      result[field] = getXmlText(itemXml, field);
    }
    return result;
  });
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function formatKiprisDate(date: string): string {
  if (!date || date.length !== 8) return date;
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}
