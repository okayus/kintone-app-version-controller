/**
 * バージョン管理サービスのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionService } from './version-service';
import { ApiClient } from '../utils/api-client';

// ApiClientのモック
vi.mock('../utils/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getRecords: vi.fn().mockResolvedValue([
          {
            appId: { value: '1' },
            version: { value: '1.0.0' },
            data: { value: JSON.stringify({ name: 'App 1' }) },
          },
        ]),
        postRecord: vi.fn().mockResolvedValue({ id: '1001' }),
      };
    }),
  };
});

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    versionService = new VersionService();
  });

  // 今後テストを追加予定
});
