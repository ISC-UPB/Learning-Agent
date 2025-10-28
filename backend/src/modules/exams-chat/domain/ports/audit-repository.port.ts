export interface AuditRepository {
  record(entry: {
    questionId?: string;
    timestamp: Date;
    signature: string;
    source: 'cached' | 'generated';
    tokensUsed: number;
  }): Promise<void>;
}
