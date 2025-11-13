import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_PORT } from '../../tokens';
import type { ConfigPort } from '../ports/config.port';

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

  constructor(
    @Inject(CONFIG_PORT) private readonly config: ConfigPort,
  ) {}

  /**
   * Calcula la expiración del token de acceso.
   */
  calculateAccessExpiration(fromDate: Date = new Date()): TTLCalculationResult {
    const ttl = this.config.getJwtAccessTTL();
    return this.calculate(ttl, fromDate);
  }

  /**
   * Calcula la expiración del token de refresh.
   */
  calculateRefreshExpiration(fromDate: Date = new Date()): TTLCalculationResult {
    const ttl = this.config.getJwtRefreshTTL();
    return this.calculate(ttl, fromDate);
  }

  /**
   * Lógica interna para convertir TTL a fecha/milisegundos.
   */
  private calculate(ttl: string, fromDate: Date): TTLCalculationResult {
  const match = ttl.match(/^(\d+)([a-zA-Z])$/);
    if (!match) throw new InvalidTTLFormatError(ttl);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multiplier = this.unitMap[unit];
    if (!multiplier) throw new UnsupportedTTLUnitError(unit);

    const milliseconds = value * multiplier;
    const expiresAt = new Date(fromDate.getTime() + milliseconds);

    return { expiresAt, milliseconds };
  }
}
