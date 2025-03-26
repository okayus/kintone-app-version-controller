/**
 * アプリ情報取得サービスのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppService } from './app-service';
import { ApiClient } from '../utils/api-client';

// ApiClientのモック
vi.mock('../utils/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getApps: vi.fn().mockResolvedValue([
          { appId: '1', name: 'App 1' },
          { appId: '2', name: 'App 2' },
        ]),
        getApp: vi.fn().mockResolvedValue({
          appId: '1',
          name: 'App 1',
          description: 'App description',
        }),
      };
    }),
  };
});

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  // 今後テストを追加予定
});
