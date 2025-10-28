export class InvalidCredentialsError extends Error {
  public readonly code = 'AUTH_INVALID_CREDENTIALS';

  constructor() {
    super('Invalid credentials provided.');
    this.name = 'InvalidCredentialsError';
  }
}

export class InactiveUserError extends Error {
  public readonly code = 'AUTH_INACTIVE_USER';

  constructor() {
    super('User account is inactive.');
    this.name = 'InactiveUserError';
  }
}
