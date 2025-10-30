import { Document } from '../entities/document.entity';
import { UploadDocumentRequest, DocumentListItem } from '../value-objects/upload-document.vo';

/**
 * Puerto para almacenamiento de documentos
 */
export interface DocumentStoragePort {
  /**
   * Obtiene el contenido de un archivo
   * @param key Clave del archivo
   */
  getFileContent(key: string): Promise<Buffer>;

  /**
   * Sube un archivo al storage
   * @param key Clave del archivo
   * @param content Contenido del archivo
   */
  putFileContent(key: string, content: Buffer): Promise<void>;

  /**
   * Elimina un archivo del storage
   * @param key Clave del archivo
   * @param isRollback Indica si es una operación de rollback
   */
  deleteFile(key: string, isRollback?: boolean): Promise<void>;

  /**
   * Sube un documento al storage
   */
  uploadDocument(req: UploadDocumentRequest): Promise<Document>;

  /**
   * Genera una URL de descarga firmada
   */
  generateDownloadUrl(fileName: string): Promise<string>;

  /**
   * Lista todos los documentos en el storage
   */
  listDocuments(): Promise<DocumentListItem[]>;

  /**
   * Verifica si un archivo existe
   */
  documentExists(fileName: string): Promise<boolean>;

  /**
   * Realiza un soft delete moviendo el archivo a la carpeta deleted/
   */
  softDeleteDocument(fileName: string): Promise<void>;

  /**
   * Descarga el contenido de un archivo como Buffer
   */
  downloadFileBuffer(fileName: string): Promise<Buffer>;

  /**
   * Verifica si un archivo existe
   */
  exists(s3Key: string): Promise<boolean>;

  /**
   * Mueve un archivo de una ubicación a otra
   */
  moveFile(sourceKey: string, destinationKey: string): Promise<void>;
}