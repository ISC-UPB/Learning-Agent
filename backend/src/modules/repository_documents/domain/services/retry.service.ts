import { Injectable } from '@nestjs/common';

export interface RetryConfig {
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  maxAttempts: number;
}

@Injectable()
export class RetryService {
  private static instance: RetryService;
  private readonly config: RetryConfig = {
    initialDelay: 1000, // 1 segundo
    maxDelay: 30000,   // 30 segundos
    backoffFactor: 2,  // Multiplicador exponencial
    maxAttempts: 3,    // Máximo número de intentos
  };

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      throw new Error('[FATAL] RetryService not initialized. Ensure it is properly injected in documents.module.ts');
    }
    return RetryService.instance;
  }

  constructor() {
    RetryService.instance = this;
  }

  /**
   * Calcula el delay para el siguiente reintento usando backoff exponencial
   */
  calculateDelay(attemptCount: number): number {
    const delay = this.config.initialDelay * Math.pow(this.config.backoffFactor, attemptCount - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Verifica si un job debería ser reintentado basado en su número de intentos
   */
  shouldRetry(attemptCount: number): boolean {
    return attemptCount < this.config.maxAttempts;
  }

  /**
   * Ejecuta el delay para el siguiente reintento
   */
  async delay(attemptCount: number): Promise<void> {
    const delayMs = this.calculateDelay(attemptCount);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}