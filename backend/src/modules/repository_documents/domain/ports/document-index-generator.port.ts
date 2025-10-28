import { DocumentIndex } from '../entities/document-index.entity';
import { DocumentChunk } from '../entities/document-chunk.entity';

export interface DocumentIndexGeneratorPort {
  /**
   * Generate an index with exercises from the chunks of a document
   */
  generateDocumentIndex(
    documentId: string,
    documentTitle: string,
    chunks: DocumentChunk[],
    config?: Partial<IndexGenerationConfig>,
  ): Promise<DocumentIndex>;
}

export interface IndexGenerationConfig {
  /** Model of LLM to use */
  model?: string;

  /** Temperature for generation */
  temperature?: number;

  /** Maximum number of tokens per response */
  maxTokens?: number;

  /** Language of the content */
  language?: string;

  /** Detail level desired */
  detailLevel?: 'basic' | 'intermediate' | 'advanced';

  /** Types of exercises to include */
  exerciseTypes?: string[];
}
