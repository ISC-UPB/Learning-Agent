import { Injectable, Logger } from '@nestjs/common';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';
import { DocumentChunk } from '../entities/document-chunk.entity';

@Injectable()
export class DocumentChunkDeduplicationService {
  private readonly logger = new Logger(DocumentChunkDeduplicationService.name);

  constructor(
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Procesa chunks asegurando que no haya duplicados
   */
  async processChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const uniqueChunks = new Map<string, DocumentChunk>();
    
    for (const chunk of chunks) {
      // Si ya existe un chunk con el mismo hash, lo ignoramos
      if (!uniqueChunks.has(chunk.contentHash)) {
        // Verificamos si ya existe en la base de datos
        const existingChunks = await this.chunkRepository.findByContentHash(chunk.contentHash);
        
        if (existingChunks.length === 0) {
          // Si no existe, lo agregamos
          uniqueChunks.set(chunk.contentHash, chunk);
        } else {
          this.logger.debug(`Chunk duplicado encontrado con hash: ${chunk.contentHash}`);
        }
      }
    }

    return Array.from(uniqueChunks.values());
  }

  /**
   * Procesa chunks similares basados en embeddings
   */
  async processSimilarChunks(chunks: DocumentChunk[], threshold: number = 0.9): Promise<DocumentChunk[]> {
    const result: DocumentChunk[] = [];
    
    for (const chunk of chunks) {
      if (!chunk.embedding) {
        result.push(chunk);
        continue;
      }

      // Buscar chunks similares
      const similarChunks = await this.chunkRepository.findSimilarChunks(
        chunk.embedding,
        threshold,
        5
      );

      // Si no hay chunks similares, agregamos el nuevo
      if (similarChunks.length === 0) {
        result.push(chunk);
      } else {
        this.logger.debug(
          `Chunk similar encontrado para chunk ${chunk.id}. Similitud: ${threshold}`
        );
      }
    }

    return result;
  }

  /**
   * Encuentra y resuelve duplicados en un documento
   */
  async findAndResolveDuplicates(documentId: string): Promise<void> {
    const duplicates = await this.chunkRepository.findDuplicateChunks(documentId);
    
    if (duplicates.length > 0) {
      this.logger.log(
        `Encontrados ${duplicates.length} chunks duplicados en documento ${documentId}`
      );

      // Aquí podríamos implementar la lógica para resolver duplicados
      // Por ejemplo, mantener el chunk más reciente y eliminar los otros
    }
  }
}