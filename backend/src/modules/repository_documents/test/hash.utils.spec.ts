import {
  generateContentHash,
  generateContentHashes,
  isValidHash,
} from '../infrastructure/utils/hash.utils';

describe('Hash Utils', () => {
  describe('generateContentHash', () => {
    it('should generate consistent hashes for the same content', () => {
      const content = 'This is a test chunk of text';
      const hash1 = generateContentHash(content);
      const hash2 = generateContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different content', () => {
      const content1 = 'This is chunk 1';
      const content2 = 'This is chunk 2';

      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize whitespace before hashing', () => {
      const content1 = 'This  is   a   test';
      const content2 = 'This is a test';

      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);

      expect(hash1).toBe(hash2); // Should be the same after normalization
    });

    it('should trim content before hashing', () => {
      const content1 = '  This is a test  ';
      const content2 = 'This is a test';

      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);

      expect(hash1).toBe(hash2);
    });

    it('should throw error for empty content', () => {
      expect(() => generateContentHash('')).toThrow(
        'Content cannot be empty for hash generation',
      );
    });
  });

  describe('generateContentHashes', () => {
    it('should generate hashes for multiple contents', () => {
      const contents = ['Content 1', 'Content 2', 'Content 3'];
      const hashes = generateContentHashes(contents);

      expect(hashes).toHaveLength(3);
      expect(hashes[0]).toHaveLength(64);
      expect(hashes[1]).toHaveLength(64);
      expect(hashes[2]).toHaveLength(64);
      expect(hashes[0]).not.toBe(hashes[1]);
      expect(hashes[1]).not.toBe(hashes[2]);
    });

    it('should handle empty array', () => {
      const hashes = generateContentHashes([]);
      expect(hashes).toEqual([]);
    });
  });

  describe('isValidHash', () => {
    it('should validate correct SHA-256 hashes', () => {
      const validHash =
        'a'.repeat(64); // 64 hex characters
      expect(isValidHash(validHash)).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(isValidHash('invalid')).toBe(false);
      expect(isValidHash('a'.repeat(63))).toBe(false); // Too short
      expect(isValidHash('a'.repeat(65))).toBe(false); // Too long
      expect(isValidHash('z'.repeat(64))).toBe(false); // Invalid hex character
    });
  });
});
