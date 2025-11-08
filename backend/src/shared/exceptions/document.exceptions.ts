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
