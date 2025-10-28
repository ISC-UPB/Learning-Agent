export interface ConfigPort {
  getJwtAccessTTL(): string;
  getJwtRefreshTTL(): string;
  getJwtAccessSecret(): string;
  getJwtRefreshSecret(): string;
}
