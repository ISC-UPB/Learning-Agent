import { Document, DocumentStatus } from '../entities/document.entity';

/**
 * Puerto para el repositorio de documentos
 */
export interface DocumentRepositoryPort {
  /**
   * Guarda un documento
   */
  save(document: Document): Promise<Document>;

  /**
   * Busca un documento por su ID
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Elimina un documento
   */
  delete(id: string): Promise<void>;

  /**
   * Busca un documento por su hash de archivo
   */
  findByFileHash(fileHash: string): Promise<Document | null>;

  /**
   * Busca un documento por su hash de texto
   */
  findByTextHash(textHash: string): Promise<Document | null>;

  /**
   * Busca un documento por su clave S3
   */
  findByS3Key(s3Key: string): Promise<Document | null>;

  /**
   * Busca documentos por estado
   */
  findByStatus(status: DocumentStatus): Promise<Document[]>;

  /**
   * Actualiza el estado de un documento
   */
  updateStatus(id: string, status: DocumentStatus): Promise<Document | null>;

  /**
   * Actualiza el texto extraído de un documento
   */
  updateExtractedText(
    id: string,
    extractedText: string,
    pageCount?: number,
    documentTitle?: string,
    documentAuthor?: string,
    language?: string,
  ): Promise<Document | null>;

  /**
   * Busca todos los documentos
   */
  findAll(offset?: number, limit?: number): Promise<Document[]>;

  /**
   * Busca documentos con filtros
   */
  findWithFilters(
    filters?: { courseId?: string; classId?: string },
    offset?: number,
    limit?: number,
  ): Promise<Document[]>;

  /**
   * Cuenta el número de documentos por estado
   */
  countByStatus(status: DocumentStatus): Promise<number>;

  /**
   * Encuentra documentos por courseId
   */
  findByCourseId(
    courseId: string,
    offset?: number,
    limit?: number,
    tipo?: string,
  ): Promise<Document[]>;

  /**
   * Cuenta documentos por courseId
   */
  countByCourseId(courseId: string, tipo?: string): Promise<number>;

  /**
   * Asocia un documento con un curso
   */
  associateWithCourse(documentId: string, courseId: string): Promise<Document | null>;

  /**
   * Restaura el estado anterior de un documento
   */
  restoreStatus(id: string, previousStatus: DocumentStatus): Promise<Document | null>;
}