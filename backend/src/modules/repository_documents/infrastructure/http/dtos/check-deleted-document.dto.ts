/**
 * DTO for deleted document verification request
 */
export class CheckDeletedDocumentRequestDto {
  skipTextExtraction?: boolean | string;
  autoRestore?: boolean | string;
}

/**
 * DTO for deleted document verification response
 */
export class CheckDeletedDocumentResponseDto {
  constructor(
    public readonly status:
      | 'exact_match'
      | 'text_match'
      | 'no_match'
      | 'restored',
    public readonly message: string,
    public readonly deletedDocument?: DeletedDocumentDto,
    public readonly restoredDocument?: RestoredDocumentDto,
  ) {}
}

/**
 * DTO to represent a found deleted document
 */
export class DeletedDocumentDto {
  constructor(
    public readonly id: string,
    public readonly originalName: string,
    public readonly documentTitle: string | null,
    public readonly documentAuthor: string | null,
    public readonly uploadedAt: Date,
    public readonly uploadedBy: string,
    public readonly deletedAt: Date,
    public readonly matchType: 'binary_hash' | 'text_hash',
    public readonly size: number,
    public readonly pageCount?: number,
  ) {}
}

/**
 * DTO to represent a restored document
 */
export class RestoredDocumentDto {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly downloadUrl: string,
    public readonly restoredAt: Date,
  ) {}
}

/**
 * DTO for manual document restoration request
 */
export class RestoreDocumentRequestDto {
  constructor(public readonly documentId: string) {}
}

/**
 * DTO for document restoration response
 */
export class RestoreDocumentResponseDto {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly restoredDocument?: RestoredDocumentDto,
  ) {}
}
