import * as crypto from 'crypto';

/**
 * Generates a SHA-256 hash from a string
 * Used for content deduplication
 */
export function generateContentHash(content: string): string {
  if (!content) {
    throw new Error('Content cannot be empty for hash generation');
  }

  // Normalize content: trim and normalize whitespace
  const normalizedContent = content.trim().replace(/\s+/g, ' ');

  // Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(normalizedContent, 'utf8')
    .digest('hex');
}

/**
 * Generates hashes for multiple contents in batch
 */
export function generateContentHashes(contents: string[]): string[] {
  return contents.map((content) => generateContentHash(content));
}

/**
 * Validates if a string is a valid SHA-256 hash
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}
