import { ProcessingJobService } from '../domain/services/processing-job.service';
import { ProcessingType } from '../domain/entities/processing-job.entity';
import { RETRY_CONFIG } from '../infrastructure/config/retry.config';
import * as retryUtils from '../infrastructure/services/retry.utils';

describe('ProcessingJobService.executeWithRetry - unit', () => {
  beforeAll(() => {
    // speed up retries by removing backoff
    jest.spyOn(retryUtils, 'getBackoffDelay').mockReturnValue(0);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('persists a dead-letter after exceeding max attempts', async () => {
    const mockSave = jest.fn().mockResolvedValue({ id: 'mock-dead' });
    const mockRepo: any = { save: mockSave };

    // Inject mock repo
    ProcessingJobService.setDeadLetterRepo(mockRepo);

    const job = ProcessingJobService.create(
      'job-unit-1',
      'doc-unit-1',
      ProcessingType.TEXT_EXTRACTION,
      { foo: 'bar' },
    );

    const handler = jest.fn().mockRejectedValue(new Error('handler-failed'));

    await ProcessingJobService.executeWithRetry(job, handler);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-unit-1',
        documentId: 'doc-unit-1',
        attempts: RETRY_CONFIG.maxAttempts,
      }),
    );
  });
});
