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
        getFormFields: vi.fn().mockResolvedValue({
          properties: { field1: { type: 'SINGLE_LINE_TEXT' } }
        }),
        getFormLayout: vi.fn().mockResolvedValue({
          layout: [{ type: 'ROW' }]
        }),
        getViews: vi.fn().mockResolvedValue({
          views: { view1: { type: 'LIST' } }
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

  it('should get all apps', async () => {
    const apps = await appService.getAllApps();
    expect(apps).toHaveLength(2);
    expect(apps[0].appId).toBe('1');
    expect(apps[1].name).toBe('App 2');
  });

  it('should get app details', async () => {
    const appDetails = await appService.getAppDetails(1);
    expect(appDetails.appInfo).toBeDefined();
    expect(appDetails.fields).toBeDefined();
    expect(appDetails.layout).toBeDefined();
    expect(appDetails.views).toBeDefined();
  });

  it('should get app form fields', async () => {
    const fields = await appService.getAppFormFields(1);
    expect(fields.properties).toBeDefined();
    expect(fields.properties.field1.type).toBe('SINGLE_LINE_TEXT');
  });

  it('should get app form layout', async () => {
    const layout = await appService.getAppFormLayout(1);
    expect(layout.layout).toHaveLength(1);
  });

  it('should get app views', async () => {
    const views = await appService.getAppViews(1);
    expect(views.views).toBeDefined();
    expect(views.views.view1.type).toBe('LIST');
  });
});