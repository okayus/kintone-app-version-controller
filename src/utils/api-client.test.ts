/**
 * API通信クライアントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from './api-client';

// KintoneRestAPIClientのモック
vi.mock('@kintone/rest-api-client', () => {
  return {
    KintoneRestAPIClient: vi.fn().mockImplementation(() => {
      return {
        app: {
          getApps: vi.fn().mockResolvedValue({
            apps: [
              { appId: '1', name: 'App 1' },
              { appId: '2', name: 'App 2' },
            ],
          }),
          getApp: vi.fn().mockResolvedValue({
            appId: '1',
            name: 'App 1',
            description: 'App description',
          }),
        },
      };
    }),
  };
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('getApps', () => {
    it('returns app list', async () => {
      const apps = await apiClient.getApps();
      expect(apps).toHaveLength(2);
      expect(apps[0].appId).toBe('1');
      expect(apps[1].appId).toBe('2');
    });
  });

  describe('getApp', () => {
    it('returns app details', async () => {
      const app = await apiClient.getApp(1);
      expect(app.appId).toBe('1');
      expect(app.name).toBe('App 1');
      expect(app.description).toBe('App description');
    });
  });
});
