export class ExtractedText {
  constructor(
    public readonly content: string,
    public readonly pageCount?: number,
    public readonly documentTitle?: string,
    public readonly documentAuthor?: string,
    public readonly language?: string,
    public readonly extractionMetadata?: Record<string, any>,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Extracted text cannot be empty');
    }

    if (this.pageCount !== undefined && this.pageCount < 1) {
      throw new Error('Page count must be greater than 0');
    }
  }

  /**
   * Gets extracted text length
   */
  getContentLength(): number {
    return this.content.length;
  }

  /**
   * Gets approximate word count
   */
  getWordCount(): number {
    return this.content.trim().split(/\s+/).length;
  }

  /**
   * Checks if text has extracted title
   */
  hasTitle(): boolean {
    return Boolean(this.documentTitle && this.documentTitle.trim().length > 0);
  }

  /**
   * Checks if text has extracted author
   */
  hasAuthor(): boolean {
    return Boolean(
      this.documentAuthor && this.documentAuthor.trim().length > 0,
    );
  }

  /**
   * Gets text summary (first N characters)
   */
  getSummary(maxLength: number = 200): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }

    return this.content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Creates instance with additional metadata
   */
  withMetadata(metadata: Record<string, any>): ExtractedText {
    return new ExtractedText(
      this.content,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      { ...this.extractionMetadata, ...metadata },
    );
  }
}
