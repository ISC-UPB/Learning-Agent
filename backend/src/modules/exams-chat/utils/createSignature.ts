import crypto from 'crypto';

function normalizeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = normalizeValue(value[k]);
    return out;
  }
  return value;
}

export function createSignature(payload: any): string {
  const normalized = normalizeValue(payload);
  const str = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(str).digest('hex');
}
