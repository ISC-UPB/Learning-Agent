import { createHash } from 'crypto';

export class DocumentChunk {
  public readonly contentHash: string;

  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public content: string,
    public readonly chunkIndex: number,
    public type: string,
    public readonly metadata?: Record<string, any>,
    public readonly embedding?: number[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.contentHash = this.calculateContentHash();
    this.validate();
  }

  private validate(): void {
    if (!this.id) throw new Error('Chunk ID is required');
    if (!this.documentId) throw new Error('Document ID is required');
    if (!this.content) throw new Error('Chunk content is required');
    if (this.chunkIndex < 0) throw new Error('Chunk index must be non-negative');
  }

  private calculateContentHash(): string {
    return createHash('sha256')
      .update(this.content.trim().toLowerCase())
      .digest('hex');
  }

  withEmbedding(embedding: number[]): DocumentChunk {
    return new DocumentChunk(
      this.id,
      this.documentId,
      this.content,
      this.chunkIndex,
      this.type,
      this.metadata,
      embedding,
      this.createdAt,
      new Date(),
    );
  }

  equals(other: DocumentChunk): boolean {
    return this.contentHash === other.contentHash;
  }

  /**
   * Determina si el chunk es similar a otro basado en su contenido
   */
  isSimilarTo(other: DocumentChunk, threshold: number = 0.9): boolean {
    // Si tienen el mismo hash, son iguales
    if (this.equals(other)) return true;

    // Comparar embeddings si están disponibles
    if (this.embedding && other.embedding) {
      return this.cosineSimilarity(this.embedding, other.embedding) >= threshold;
    }

    return false;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }
}
