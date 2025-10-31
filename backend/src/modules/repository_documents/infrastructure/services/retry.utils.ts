import { RETRY_CONFIG } from "../config/retry.config";

export function getBackoffDelay(attempt: number): number {
  const { baseDelayMs, maxDelayMs, jitter } = RETRY_CONFIG;
  let delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);

  if (jitter) {
    const random = Math.random() * delay * 0.2; 
    delay = delay + (Math.random() > 0.5 ? random : -random);
  }
  return Math.max(0, delay);
}
