import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class RequestInfoService {
  /**
   * Extracts client information from the HTTP request
   * @param req - Express request object
   * @param userAgent - User-Agent header value
   * @returns Object containing client IP and user agent
   */
  extractClientInfo(req: Request, userAgent?: string): ClientInfo {
    const ip = this.extractClientIp(req);

    return {
      ip,
      userAgent,
    };
  }

  /**
   * Extracts client IP address from request headers and socket
   * Prioritizes X-Forwarded-For header for proxy/load balancer scenarios
   * @param req - Express request object
   * @returns Client IP address or undefined if not available
   */
  private extractClientIp(req: Request): string | undefined {
    // Check X-Forwarded-For header first (for proxy/load balancer scenarios)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one (client's real IP)
      return forwardedFor.split(',')[0]?.trim();
    }

    // Fallback to direct connection IP
    return req.socket.remoteAddress || undefined;
  }
}
