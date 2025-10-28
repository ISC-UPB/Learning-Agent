import { Test, TestingModule } from '@nestjs/testing';
import { 
  TokenExpirationService, 
  InvalidTTLFormatError, 
  UnsupportedTTLUnitError 
} from './token-expiration.service';

describe('TokenExpirationService', () => {
  let service: TokenExpirationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenExpirationService],
    }).compile();

    service = module.get<TokenExpirationService>(TokenExpirationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateExpiration', () => {
    it('should calculate expiration for seconds', () => {
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const result = service.calculateExpiration('30s', baseDate);
      
      expect(result.expiresAt).toEqual(new Date('2024-01-01T00:00:30Z'));
      expect(result.milliseconds).toBe(30000);
    });

    it('should calculate expiration for minutes', () => {
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const result = service.calculateExpiration('15m', baseDate);
      
      expect(result.expiresAt).toEqual(new Date('2024-01-01T00:15:00Z'));
      expect(result.milliseconds).toBe(900000);
    });

    it('should calculate expiration for hours', () => {
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const result = service.calculateExpiration('2h', baseDate);
      
      expect(result.expiresAt).toEqual(new Date('2024-01-01T02:00:00Z'));
      expect(result.milliseconds).toBe(7200000);
    });

    it('should calculate expiration for days', () => {
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const result = service.calculateExpiration('7d', baseDate);
      
      expect(result.expiresAt).toEqual(new Date('2024-01-08T00:00:00Z'));
      expect(result.milliseconds).toBe(604800000);
    });

    it('should use current date when no base date provided', () => {
      const before = new Date();
      const result = service.calculateExpiration('1h');
      const after = new Date(before.getTime() + 3600000);
      
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime() + 3600000);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw InvalidTTLFormatError for invalid format', () => {
      expect(() => service.calculateExpiration('invalid')).toThrow(InvalidTTLFormatError);
      expect(() => service.calculateExpiration('')).toThrow(InvalidTTLFormatError);
      expect(() => service.calculateExpiration('1x')).toThrow(InvalidTTLFormatError);
      expect(() => service.calculateExpiration('m')).toThrow(InvalidTTLFormatError);
    });

    it('should throw UnsupportedTTLUnitError for unsupported units', () => {
      expect(() => service.calculateExpiration('1w')).toThrow(UnsupportedTTLUnitError);
      expect(() => service.calculateExpiration('1y')).toThrow(UnsupportedTTLUnitError);
    });
  });

  describe('toMilliseconds', () => {
    it('should convert TTL to milliseconds', () => {
      expect(service.toMilliseconds('1s')).toBe(1000);
      expect(service.toMilliseconds('1m')).toBe(60000);
      expect(service.toMilliseconds('1h')).toBe(3600000);
      expect(service.toMilliseconds('1d')).toBe(86400000);
      expect(service.toMilliseconds('30s')).toBe(30000);
    });
  });

  describe('getSupportedUnits', () => {
    it('should return supported units', () => {
      const units = service.getSupportedUnits();
      expect(units).toEqual(['s', 'm', 'h', 'd']);
    });
  });
});