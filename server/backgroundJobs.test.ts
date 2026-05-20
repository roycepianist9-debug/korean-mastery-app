import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startBatchTranslationJob, getJobStatus } from './backgroundJobs';

describe('Background Jobs - Batch Translation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start a batch translation job and return immediately with job ID', async () => {
    const result = await startBatchTranslationJob('chinese');
    
    expect(result).toHaveProperty('jobId');
    expect(result).toHaveProperty('message');
    expect(result.jobId).toMatch(/^batch-chinese-\d+$/);
    expect(result.message).toContain('started in background');
  });

  it('should start a Korean batch translation job', async () => {
    const result = await startBatchTranslationJob('korean');
    
    expect(result).toHaveProperty('jobId');
    expect(result.jobId).toMatch(/^batch-korean-\d+$/);
  });

  it('should track job status after starting', async () => {
    const result = await startBatchTranslationJob('chinese');
    const jobId = result.jobId;
    
    // Check initial status
    const status = getJobStatus(jobId);
    expect(status).toBeDefined();
    expect(status?.status).toBe('running');
    expect(status?.startedAt).toBeGreaterThan(0);
    expect(status?.totalChunks).toBe(0);
    expect(status?.processedChunks).toBe(0);
    expect(status?.successCount).toBe(0);
    expect(status?.failureCount).toBe(0);
  });

  it('should return null for non-existent job', () => {
    const status = getJobStatus('non-existent-job-id');
    expect(status).toBeNull();
  });

  it('should handle multiple concurrent jobs', async () => {
    const chineseResult = await startBatchTranslationJob('chinese');
    const koreanResult = await startBatchTranslationJob('korean');
    
    expect(chineseResult.jobId).not.toBe(koreanResult.jobId);
    
    const chineseStatus = getJobStatus(chineseResult.jobId);
    const koreanStatus = getJobStatus(koreanResult.jobId);
    
    expect(chineseStatus).toBeDefined();
    expect(koreanStatus).toBeDefined();
    expect(chineseStatus?.status).toBe('running');
    expect(koreanStatus?.status).toBe('running');
  });

  it('should return job ID in response for polling', async () => {
    const result = await startBatchTranslationJob('korean');
    
    // Simulate polling
    const status1 = getJobStatus(result.jobId);
    expect(status1).toBeDefined();
    
    // Poll again
    const status2 = getJobStatus(result.jobId);
    expect(status2).toBeDefined();
    expect(status1?.startedAt).toBe(status2?.startedAt);
  });

  it('should initialize job with correct structure', async () => {
    const result = await startBatchTranslationJob('chinese');
    const status = getJobStatus(result.jobId);
    
    expect(status).toMatchObject({
      status: 'running',
      totalChunks: 0,
      processedChunks: 0,
      successCount: 0,
      failureCount: 0,
      currentChunk: 0,
    });
    expect(status?.startedAt).toBeGreaterThan(0);
  });
});
