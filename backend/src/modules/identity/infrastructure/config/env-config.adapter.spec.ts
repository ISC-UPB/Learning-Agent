import { ConfigService } from '@nestjs/config';
import { EnvConfigAdapter } from './env-config.adapter';

describe('EnvConfigAdapter', () => {
  let adapter: EnvConfigAdapter;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    } as any;

    adapter = new EnvConfigAdapter(configService);
  });

  describe('getJwtAccessTTL', () => {
    it('should return JWT access TTL from config service', () => {
      configService.get.mockReturnValue('30m');

      const result = adapter.getJwtAccessTTL();

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TTL', '15m');
      expect(result).toBe('30m');
    });

    it('should return default value when config is not set', () => {
      configService.get.mockReturnValue('15m');

      const result = adapter.getJwtAccessTTL();

      expect(result).toBe('15m');
    });
  });

  describe('getJwtRefreshTTL', () => {
    it('should return JWT refresh TTL from config service', () => {
      configService.get.mockReturnValue('30d');

      const result = adapter.getJwtRefreshTTL();

      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TTL', '7d');
      expect(result).toBe('30d');
    });

    it('should return default value when config is not set', () => {
      configService.get.mockReturnValue('7d');

      const result = adapter.getJwtRefreshTTL();

      expect(result).toBe('7d');
    });
  });

  describe('getJwtAccessSecret', () => {
    it('should return JWT access secret from config service', () => {
      const secret = 'super-secret-access-key';
      configService.getOrThrow.mockReturnValue(secret);

      const result = adapter.getJwtAccessSecret();

      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(result).toBe(secret);
    });

    it('should throw error when JWT access secret is not configured', () => {
      configService.getOrThrow.mockImplementation(() => {
        throw new Error('JWT_ACCESS_SECRET is required');
      });

      expect(() => adapter.getJwtAccessSecret()).toThrow('JWT_ACCESS_SECRET is required');
    });
  });

  describe('getJwtRefreshSecret', () => {
    it('should return JWT refresh secret from config service', () => {
      const secret = 'super-secret-refresh-key';
      configService.getOrThrow.mockReturnValue(secret);

      const result = adapter.getJwtRefreshSecret();

      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(result).toBe(secret);
    });

    it('should throw error when JWT refresh secret is not configured', () => {
      configService.getOrThrow.mockImplementation(() => {
        throw new Error('JWT_REFRESH_SECRET is required');
      });

      expect(() => adapter.getJwtRefreshSecret()).toThrow('JWT_REFRESH_SECRET is required');
    });
  });
});
