export class DocumentListItem {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly downloadUrl: string,
    public readonly uploadedAt: Date,
    public readonly courseId?: string,
    public readonly classId?: string,
  ) {}

  /**
   * Convert the object to a flat format for the JSON response.
   */
  toJSON() {
    return {
      id: this.id,
      fileName: this.fileName,
      originalName: this.originalName,
      mimeType: this.mimeType,
      size: this.size,
      downloadUrl: this.downloadUrl,
      uploadedAt: this.uploadedAt,
      courseId: this.courseId,
      classId: this.classId,
    };
  }
}
