export const toTitleCase = (s: any): string => {
  const str = String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return str.replace(/(^|\s|[-_/])(\p{L})/gu, (sep, ch) => sep + ch.toUpperCase());
};