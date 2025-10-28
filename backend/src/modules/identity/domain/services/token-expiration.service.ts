import { Injectable } from '@nestjs/common';

export class InvalidTTLFormatError extends Error {
  constructor(ttl: string) {
    super(`Invalid TTL format: ${ttl}. Expected format: <number><unit> where unit is s, m, h, or d`);
    this.name = 'InvalidTTLFormatError';
  }
}

export class UnsupportedTTLUnitError extends Error {
  constructor(unit: string) {
    super(`Unsupported TTL unit: ${unit}. Supported units: s (seconds), m (minutes), h (hours), d (days)`);
    this.name = 'UnsupportedTTLUnitError';
  }
}

export interface TTLCalculationResult {
  expiresAt: Date;
  milliseconds: number;
}

@Injectable()
export class TokenExpirationService {
  private readonly unitMap: Record<string, number> = {
    s: 1000,        
    m: 60000,       
    h: 3600000,     
    d: 86400000,    
  };

  /**
   * Calculate expiration date based on TTL string
   * @param ttl - Time to live string in format: <number><unit> (e.g., "15m", "2h", "7d")
   * @param fromDate - Optional base date (defaults to current date)
   * @returns TTLCalculationResult with expiration date and duration in milliseconds
   * @throws {InvalidTTLFormatError} When TTL format is invalid
   * @throws {UnsupportedTTLUnitError} When TTL unit is not supported
   */
  calculateExpiration(ttl: string, fromDate: Date = new Date()): TTLCalculationResult {
    this.validateTTLFormat(ttl);

    const { value, unit } = this.parseTTL(ttl);
    
    if (!this.unitMap[unit]) {
      throw new UnsupportedTTLUnitError(unit);
    }

    const milliseconds = value * this.unitMap[unit];
    const expiresAt = new Date(fromDate.getTime() + milliseconds);

    return { expiresAt, milliseconds };
  }

  /**
   * Parse TTL string into value and unit
   */
  private parseTTL(ttl: string): { value: number; unit: string } {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new InvalidTTLFormatError(ttl);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return { value, unit };
  }

  /**
   * Validate TTL string format
   */
  private validateTTLFormat(ttl: string): void {
    if (typeof ttl !== 'string') {
      throw new InvalidTTLFormatError(String(ttl));
    }

    if (!ttl.match(/^\d+[smhd]$/)) {
      throw new InvalidTTLFormatError(ttl);
    }
  }

  /**
   * Get supported TTL units
   */
  getSupportedUnits(): string[] {
    return Object.keys(this.unitMap);
  }

  /**
   * Convert TTL to milliseconds
   */
  toMilliseconds(ttl: string): number {
    const { value, unit } = this.parseTTL(ttl);
    
    if (!this.unitMap[unit]) {
      throw new UnsupportedTTLUnitError(unit);
    }

    return value * this.unitMap[unit];
  }
}