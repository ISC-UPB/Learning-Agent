import { ProcessingJob } from '../entities/processing-job.entity';

/**
 * Puerto para el repositorio de jobs de procesamiento
 */
export interface ProcessingJobRepositoryPort {
  /**
   * Guarda un job
   */
  save(job: ProcessingJob): Promise<ProcessingJob>;

  /**
   * Busca un job por su ID
   */
  findById(id: string): Promise<ProcessingJob | null>;

  /**
   * Busca jobs activos para un documento
   */
  findActiveByDocument(documentId: string): Promise<ProcessingJob[]>;

  /**
   * Busca jobs por estado y fecha límite y los marca como fallidos
   */
  markStaleJobsAsFailed(cutoffDate: Date): Promise<number>;

  /**
   * Busca jobs similares para evitar duplicados
   */
  findDuplicateJobs(
    documentId: string, 
    jobType: string,
    contentHash: string
  ): Promise<ProcessingJob[]>;

  /**
   * Actualiza el progreso de un job
   */
  updateProgress(
    jobId: string, 
    progress: number, 
    message?: string
  ): Promise<ProcessingJob>;

  /**
   * Busca el último job exitoso para un documento
   */
  findLastSuccessfulJob(
    documentId: string,
    jobType: string
  ): Promise<ProcessingJob | null>;

  /**
   * Busca jobs que puedan ser reintentados
   */
  findRetryableJobs(): Promise<ProcessingJob[]>;
}