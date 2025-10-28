import { Document } from '../entities/document.entity';

/**
 * Request to check reusable deleted documents
 */
export class CheckDeletedDocumentRequest {
  constructor(
    public readonly file: Buffer,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly uploadedBy: string,
    public readonly options?: {
      skipTextExtraction?: boolean;
      autoRestore?: boolean;
    },
  ) {}
}

/**
 * Deleted documents check result
 */
export class DeletedDocumentCheckResult {
  constructor(
    public readonly status:
      | 'exact_match'
      | 'text_match'
      | 'no_match'
      | 'restored',
    public readonly deletedDocument?: Document,
    public readonly restoredDocument?: Document,
    public readonly message?: string,
  ) {}

  static exactMatch(deletedDocument: Document): DeletedDocumentCheckResult {
    return new DeletedDocumentCheckResult(
      'exact_match',
      deletedDocument,
      undefined,
      'found deleted document with exact binary hash',
    );
  }

  static textMatch(deletedDocument: Document): DeletedDocumentCheckResult {
    return new DeletedDocumentCheckResult(
      'text_match',
      deletedDocument,
      undefined,
      'found deleted document with identical text content',
    );
  }

  static noMatch(): DeletedDocumentCheckResult {
    return new DeletedDocumentCheckResult(
      'no_match',
      undefined,
      undefined,
      'no similar deleted documents found',
    );
  }

  static restored(
    deletedDocument: Document,
    restoredDocument: Document,
  ): DeletedDocumentCheckResult {
    return new DeletedDocumentCheckResult(
      'restored',
      deletedDocument,
      restoredDocument,
      'deleted document restored successfully',
    );
  }
}

/**
 * Deleted document candidate for restoration
 */
export class DeletedDocumentCandidate {
  constructor(
    public readonly id: string,
    public readonly originalName: string,
    public readonly documentTitle: string | undefined,
    public readonly documentAuthor: string | undefined,
    public readonly uploadedAt: Date,
    public readonly uploadedBy: string,
    public readonly deletedAt: Date,
    public readonly matchType: 'binary_hash' | 'text_hash',
    public readonly size: number,
    public readonly pageCount?: number,
  ) {}
}
