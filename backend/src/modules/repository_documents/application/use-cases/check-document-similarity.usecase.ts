import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import type { ChunkingStrategyPort } from '../../domain/ports/chunking-strategy.port';
import type { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';
import type { VectorSearchPort } from '../../domain/ports/vector-search.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import { DocumentStatus } from '../../domain/entities/document.entity';
import {
  CheckDocumentSimilarityRequest,
  DocumentSimilarityResult,
  DocumentMatch,
  SimilarDocumentCandidate,
  DocumentScore,
  GeneratedSimilarityData,
} from '../../domain/value-objects/document-similarity-check.vo';

@Injectable()
export class CheckDocumentSimilarityUseCase {
  private readonly logger = new Logger(CheckDocumentSimilarityUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly chunkingStrategy: ChunkingStrategyPort,
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly vectorSearch: VectorSearchPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  async execute(
    request: CheckDocumentSimilarityRequest,
  ): Promise<DocumentSimilarityResult> {
    try {
      this.logger.log(`Starting similarity check for: ${request.originalName}`);

      // Step 1: Check exact binary hash (SHA-256)
      const fileHash = this.generateFileHash(request.file);
      const exactMatch = await this.documentRepository.findByFileHash(fileHash);

      if (exactMatch) {
        this.logger.log(
          `Found exact binary match: ${exactMatch.id}, Status: ${exactMatch.status}, Name: ${exactMatch.originalName}`,
        );

        // Verify that document is ACTIVE (not DELETED)
        if (exactMatch.status === DocumentStatus.DELETED) {
          this.logger.warn(
            `Found document is DELETED, should have been excluded by findByFileHash`,
          );
          // Don't consider as match if deleted
          // Continue with text hash verification
        } else {
          this.logger.log(`ACTIVE document found, considering as duplicate`);
          return new DocumentSimilarityResult(
            'exact_match',
            new DocumentMatch(
              exactMatch.id,
              exactMatch.originalName,
              exactMatch.uploadedAt,
              exactMatch.uploadedBy,
              'binary_hash',
              exactMatch.documentTitle,
              exactMatch.documentAuthor,
            ),
          );
        }
      }

      // Step 2: Extract text and verify text hash
      const extractedText = await this.textExtraction.extractTextFromPdf(
        request.file,
        request.originalName,
      );

      const textHash = this.generateTextHash(extractedText.content);

      // Check for text hash match (same content, possibly different edition)
      const textHashMatch =
        await this.documentRepository.findByTextHash(textHash);
      if (textHashMatch) {
        this.logger.log(
          `Text hash match found for document: ${textHashMatch.id}`,
        );
        return new DocumentSimilarityResult(
          'text_hash_match',
          new DocumentMatch(
            textHashMatch.id,
            textHashMatch.originalName,
            textHashMatch.uploadedAt,
            textHashMatch.uploadedBy,
            'text_hash',
            textHashMatch.documentTitle,
            textHashMatch.documentAuthor,
          ),
        );
      }

      // Step 3: Skip embeddings if requested
      if (request.options?.skipEmbeddings) {
        return new DocumentSimilarityResult('no_match');
      }

      // Step 4: Generate chunks and embeddings for similarity verification
      const { similarCandidates, generatedData } =
        await this.findSimilarDocuments(
          extractedText.content,
          request.options?.similarityThreshold ?? 0.7,
          request.options?.maxCandidates ?? 10,
          request.options?.useSampling ?? true,
          request.options?.returnGeneratedData ?? false,
        );

      if (similarCandidates.length > 0) {
        this.logger.log(`Found ${similarCandidates.length} similar candidates`);
        return new DocumentSimilarityResult(
          'candidates',
          undefined,
          similarCandidates,
          `Found ${similarCandidates.length} similar documents`,
          generatedData,
        );
      }

      this.logger.log('No similar documents found');
      return new DocumentSimilarityResult(
        'no_match',
        undefined,
        undefined,
        undefined,
        generatedData,
      );
    } catch (error) {
      this.logger.error(
        `Error checking document similarity: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Generate SHA-256 hash of file content
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  // Generate hash of normalized text
  private generateTextHash(text: string): string {
    // Normalize text: lowercase, remove extra spaces and normalize line breaks
    const normalizedText = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();

    return createHash('sha256').update(normalizedText, 'utf8').digest('hex');
  }

  // Find similar documents using embeddings and vector search
  private async findSimilarDocuments(
    text: string,
    threshold: number,
    maxCandidates: number,
    useSampling: boolean,
    returnGeneratedData: boolean = false,
  ): Promise<{
    similarCandidates: SimilarDocumentCandidate[];
    generatedData?: GeneratedSimilarityData;
  }> {
    try {
      // Step 1: Generate chunks - using temporary ID
      const tempDocumentId = 'temp-similarity-check';
      const defaultConfig = this.chunkingStrategy.getDefaultConfig();

      const chunkingResult = await this.chunkingStrategy.chunkText(
        tempDocumentId,
        text,
        {
          ...defaultConfig,
          maxChunkSize: 1000,
          overlap: 200,
        },
      );

      // Step 2: Process all chunks for fully accurate verification

      const chunksToProcess = chunkingResult.chunks;

      this.logger.log(
        `Processing ${chunksToProcess.length} of ${chunkingResult.chunks.length} chunks (100% - all chunks for maximum precision)`,
      );

      // Step 3: Generate embeddings for chunks
      const chunkContents = chunksToProcess.map(
        (chunk: any) => chunk.content as string,
      );
      const embeddingResult =
        await this.embeddingGenerator.generateBatchEmbeddings(chunkContents);

      // Step 4: Search for similar chunks
      const documentScores = new Map<string, DocumentScore>();

      // DEBUG: Check if there are active documents in database
      const activeDocuments = await this.documentRepository.findAll();
      this.logger.log(
        `DEBUG: Active documents in database: ${activeDocuments.length}`,
      );

      if (activeDocuments.length === 0) {
        this.logger.warn(
          `No active documents in database to compare. DB appears to be empty.`,
        );
        // Continue but we already know there will be no results
      } else {
        // DEBUG: Check chunks for each document
        for (const doc of activeDocuments.slice(0, 3)) {
          // Only first 3 to avoid spam logs
          const chunkCount = await this.chunkRepository.countByDocumentId(
            doc.id,
          );
          this.logger.log(
            `DEBUG: Document ${doc.id} (${doc.originalName}): ${chunkCount} chunks`,
          );
        }
      }

      for (let i = 0; i < embeddingResult.embeddings.length; i++) {
        const embedding = embeddingResult.embeddings[i];

        // DEBUG: Detailed log for first chunks
        if (i < 3) {
          this.logger.log(
            `DEBUG: Searching chunk ${i + 1}/${embeddingResult.embeddings.length} - Embedding dimensions: ${embedding.length}`,
          );
        }

        const searchResults = await this.vectorSearch.searchByVector(
          embedding,
          {
            limit: 5, // 5 best matches per chunk
            similarityThreshold: Math.max(0.3, threshold - 0.2), // More permissive for individual chunks
          },
        );

        // DEBUG: Log search results
        if (i < 3 || searchResults.chunks.length > 0) {
          this.logger.log(
            `DEBUG: Chunk ${i + 1} found ${searchResults.chunks.length} similar results`,
          );
          if (searchResults.chunks.length > 0) {
            searchResults.chunks.forEach((result, idx) => {
              this.logger.log(
                `  - Result ${idx + 1}: Doc ${result.documentId}, similarity: ${result.similarityScore.toFixed(3)}`,
              );
            });
          }
        }

        // Add results by document
        for (const result of searchResults.chunks) {
          const docId = result.documentId;
          if (!documentScores.has(docId)) {
            // Get real number of chunks from document in DB
            const documentChunkCount =
              await this.chunkRepository.countByDocumentId(docId);

            documentScores.set(docId, {
              documentId: docId,
              similarities: [],
              matchedChunks: 0,
              totalChunks: documentChunkCount,
              avgSimilarity: 0,
              coverage: 0,
              finalScore: 0,
            });
          }

          const docScore = documentScores.get(docId)!;
          docScore.similarities.push(result.similarityScore);
          docScore.matchedChunks++;
        }
      }

      // Step 5: Calculate final scores and filter candidates
      const candidatesList: SimilarDocumentCandidate[] = [];

      this.logger.log(
        `Documents found in vector search: ${documentScores.size}`,
      );

      for (const [docId, score] of documentScores) {
        // Calculate metrics
        score.avgSimilarity =
          score.similarities.reduce((a, b) => a + b, 0) /
          score.similarities.length;
        score.coverage = score.matchedChunks / Math.max(score.totalChunks, 1); // Avoid division by 0

        // Limit coverage to maximum 1.0 (100%)
        score.coverage = Math.min(score.coverage, 1.0);

        // Normalize avgSimilarity to range [0,1]
        score.avgSimilarity = Math.min(Math.max(score.avgSimilarity, 0), 1.0);

        score.finalScore = score.avgSimilarity * score.coverage;

        // Ensure finalScore is in range [0,1]
        score.finalScore = Math.min(Math.max(score.finalScore, 0), 1.0);

        this.logger.log(
          `Document ${docId}: chunks=${score.matchedChunks}/${score.totalChunks}, avgSim=${score.avgSimilarity.toFixed(3)}, coverage=${score.coverage.toFixed(3)}, finalScore=${score.finalScore.toFixed(3)}, threshold=${threshold}`,
        );

        // Filter by threshold
        if (score.finalScore >= threshold) {
          this.logger.log(
            `Document ${docId} exceeds threshold, adding as candidate`,
          );

          const document = await this.documentRepository.findById(docId);
          if (document) {
            candidatesList.push(
              new SimilarDocumentCandidate(
                document.id,
                document.originalName,
                document.uploadedAt,
                document.uploadedBy,
                score.finalScore,
                score.avgSimilarity,
                score.coverage,
                score.matchedChunks,
                score.totalChunks,
                document.documentTitle,
                document.documentAuthor,
              ),
            );
          }
        } else {
          this.logger.log(
            `Document ${docId} does NOT exceed threshold (${score.finalScore.toFixed(3)} < ${threshold})`,
          );
        }
      }

      this.logger.log(`Final candidates found: ${candidatesList.length}`);

      // Sort by score (highest first) and limit results
      const finalCandidates = candidatesList
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, maxCandidates);

      // Prepare generated data for reuse if requested
      const generatedData: GeneratedSimilarityData | undefined =
        returnGeneratedData
          ? {
              chunks: chunksToProcess,
              embeddings: embeddingResult.embeddings,
              extractedText: text,
              chunkingConfig: {
                maxChunkSize: 1000,
                overlap: 200,
              },
            }
          : undefined;

      return {
        similarCandidates: finalCandidates,
        generatedData,
      };
    } catch (error) {
      this.logger.error(
        `Error finding similar documents: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Sample chunks for faster processing
  // Take chunks from beginning, middle and end of document
  private sampleChunks(chunks: any[], maxSamples: number): any[] {
    if (chunks.length <= maxSamples) {
      return chunks;
    }

    const sampled: any[] = [];
    const step = chunks.length / maxSamples;

    // Take samples distributed throughout the document
    for (let i = 0; i < maxSamples; i++) {
      const index = Math.floor(i * step);
      sampled.push(chunks[index]);
    }

    return sampled;
  }
}
