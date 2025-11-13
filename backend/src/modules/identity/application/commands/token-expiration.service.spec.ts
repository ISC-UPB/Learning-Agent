import { Test, TestingModule } from '@nestjs/testing';
import { TokenExpirationService, InvalidTTLFormatError, UnsupportedTTLUnitError } from '../../domain/services/token-expiration.service';
import { CONFIG_PORT } from '../../tokens';
import type { ConfigPort } from '../../domain/ports/config.port';

describe('TokenExpirationService', () => {
  let service: TokenExpirationService;

  const mockConfigPort: ConfigPort = {
    getJwtAccessTTL: jest.fn().mockReturnValue('15m'),
    getJwtRefreshTTL: jest.fn().mockReturnValue('7d'),
    getJwtAccessSecret: jest.fn().mockReturnValue('access-secret'),
    getJwtRefreshSecret: jest.fn().mockReturnValue('refresh-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenExpirationService,
        {
          provide: CONFIG_PORT,
          useValue: mockConfigPort,
        },
      ],
    }).compile();

    service = module.get<TokenExpirationService>(TokenExpirationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAccessExpiration', () => {
    it('should calculate expiration for access token using config TTL', () => {
      const now = new Date('2025-01-01T00:00:00Z');
      const result = service.calculateAccessExpiration(now);

      const expected = new Date(now.getTime() + 15 * 60 * 1000);
      expect(result.expiresAt.getTime()).toBe(expected.getTime());
      expect(result.milliseconds).toBe(15 * 60 * 1000);
    });
  });

  describe('calculateRefreshExpiration', () => {
    it('should calculate expiration for refresh token using config TTL', () => {
      const now = new Date('2025-01-01T00:00:00Z');
      const result = service.calculateRefreshExpiration(now);

      const expected = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(result.expiresAt.getTime()).toBe(expected.getTime());
      expect(result.milliseconds).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('calculate (private)', () => {
    it('should throw InvalidTTLFormatError for invalid TTL format', () => {
      
      expect(() => service['calculate']('invalid', new Date())).toThrow(InvalidTTLFormatError);
    });

    it('should throw UnsupportedTTLUnitError for unsupported unit', () => {
      
      expect(() => service['calculate']('10x', new Date())).toThrow(UnsupportedTTLUnitError);
    });

    it('should correctly parse all valid TTL formats', () => {
      const now = new Date('2025-01-01T00:00:00Z');
      
      const seconds = service['calculate']('10s', now);
      
      const minutes = service['calculate']('5m', now);
      
      const hours = service['calculate']('2h', now);
     
      const days = service['calculate']('1d', now);

      expect(seconds.milliseconds).toBe(10 * 1000);
      expect(minutes.milliseconds).toBe(5 * 60 * 1000);
      expect(hours.milliseconds).toBe(2 * 60 * 60 * 1000);
      expect(days.milliseconds).toBe(24 * 60 * 60 * 1000);
    });
  });
});
