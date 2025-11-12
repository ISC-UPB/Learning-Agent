export class DocumentNotSavedError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DocumentNotSavedError';
    Object.setPrototypeOf(this, DocumentNotSavedError.prototype);
  }
}

export class StorageRollbackError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageRollbackError';
    Object.setPrototypeOf(this, StorageRollbackError.prototype);
  }
}

export class TransactionFailedError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
  }
}

export class ChunkingLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly actualValue: number,
    public readonly limit: number,
  ) {
    super(message);
    this.name = 'ChunkingLimitExceededError';
    Object.setPrototypeOf(this, ChunkingLimitExceededError.prototype);
  }
}

export class DocumentSizeExceededError extends Error {
  constructor(
    message: string,
    public readonly actualSize: number,
    public readonly maxSize: number,
  ) {
    super(message);
    this.name = 'DocumentSizeExceededError';
    Object.setPrototypeOf(this, DocumentSizeExceededError.prototype);
  }
}

export class InvalidChunkingConfigError extends Error {
  constructor(
    message: string,
    public readonly invalidFields: string[],
  ) {
    super(message);
    this.name = 'InvalidChunkingConfigError';
    Object.setPrototypeOf(this, InvalidChunkingConfigError.prototype);
  }
}
