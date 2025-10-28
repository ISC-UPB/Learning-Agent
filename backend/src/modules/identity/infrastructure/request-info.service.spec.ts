import { RequestInfoService } from './request-info.service';
import type { Request } from 'express';

describe('RequestInfoService', () => {
  let service: RequestInfoService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    service = new RequestInfoService();
    mockRequest = {
      headers: {},
      socket: {} as any,
    } as Partial<Request>;
  });

  describe('extractClientInfo', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      mockRequest.headers = {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      };

      const result = service.extractClientInfo(
        mockRequest as Request,
        'test-agent',
      );

      expect(result).toEqual({
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });
    });

    it('should extract IP from socket.remoteAddress when X-Forwarded-For is not available', () => {
      mockRequest.headers = {};
      mockRequest.socket = { remoteAddress: '127.0.0.1' } as any;

      const result = service.extractClientInfo(
        mockRequest as Request,
        'test-agent',
      );

      expect(result).toEqual({
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should handle missing IP gracefully', () => {
      mockRequest.headers = {};
      mockRequest.socket = {} as any;

      const result = service.extractClientInfo(
        mockRequest as Request,
        'test-agent',
      );

      expect(result).toEqual({
        ip: undefined,
        userAgent: 'test-agent',
      });
    });

    it('should handle missing user agent gracefully', () => {
      mockRequest.headers = {
        'x-forwarded-for': '192.168.1.1',
      };

      const result = service.extractClientInfo(mockRequest as Request);

      expect(result).toEqual({
        ip: '192.168.1.1',
        userAgent: undefined,
      });
    });

    it('should trim whitespace from X-Forwarded-For IP', () => {
      mockRequest.headers = {
        'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1',
      };

      const result = service.extractClientInfo(mockRequest as Request);

      expect(result.ip).toBe('192.168.1.1');
    });

    it('should handle empty X-Forwarded-For header', () => {
      mockRequest.headers = {
        'x-forwarded-for': '',
      };
      mockRequest.socket = { remoteAddress: '127.0.0.1' } as any;

      const result = service.extractClientInfo(mockRequest as Request);

      expect(result.ip).toBe('127.0.0.1');
    });
  });
});
