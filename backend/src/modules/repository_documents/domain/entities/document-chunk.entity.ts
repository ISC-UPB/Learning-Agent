export class DocumentChunk {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public content: string, // No readonly para permitir modificaciones durante overlap
    public readonly chunkIndex: number,
    public type: string, // Cambiar de chunkType a type y no readonly
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(), // Agregar updatedAt
  ) {}
}
