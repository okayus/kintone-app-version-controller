/**
 * アプリ情報取得サービスのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppService } from './app-service';
import { ApiClient, ApiClientError } from '../utils/api-client';
import { AppSchema } from '../types';

// ApiClientのモック
const mockGetApps = vi.fn();
const mockGetApp = vi.fn();
const mockGetFormFields = vi.fn();
const mockGetFormLayout = vi.fn();
const mockGetViews = vi.fn();
const mockGetAppCustomize = vi.fn();

vi.mock('../utils/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getApps: mockGetApps,
        getApp: mockGetApp,
        getFormFields: mockGetFormFields,
        getFormLayout: mockGetFormLayout,
        getViews: mockGetViews,
        getAppCustomize: mockGetAppCustomize,
      };
    }),
    ApiClientError: class ApiClientError extends Error {
      constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'ApiClientError';
      }
    }
  };
});

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    // モックの実装をセットアップ
    mockGetApps.mockResolvedValue([
      { appId: '1', name: 'App 1', description: 'Description 1', spaceId: '10' },
      { appId: '2', name: 'App 2', description: 'Description 2', spaceId: '20' },
    ]);
    
    mockGetApp.mockResolvedValue({
      appId: '1',
      name: 'App 1',
      description: 'App description',
      spaceId: '10',
      threadId: '100',
      creator: { code: 'user1', name: 'User 1' },
      createdAt: '2025-01-01T00:00:00Z',
      modifier: { code: 'user2', name: 'User 2' },
      modifiedAt: '2025-01-02T00:00:00Z',
    });
    
    mockGetFormFields.mockResolvedValue({
      field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1' },
      field2: { type: 'NUMBER', code: 'field2', label: 'Field 2' },
    });
    
    mockGetFormLayout.mockResolvedValue({
      layout: [
        { 
          type: 'ROW',
          code: 'row1',
          fields: [
            { type: 'SINGLE_LINE_TEXT', code: 'field1' }
          ] 
        }
      ]
    });
    
    mockGetViews.mockResolvedValue({
      views: {
        view1: { 
          id: 'view1',
          name: 'View 1',
          type: 'LIST',
          fields: ['field1']
        }
      }
    });
    
    mockGetAppCustomize.mockResolvedValue({
      desktop: {
        js: [
          { type: 'URL', url: 'https://example.com/script.js' }
        ],
        css: []
      },
      mobile: {
        js: [],
        css: []
      }
    });
    
    // テスト対象のサービスを初期化
    appService = new AppService();
  });

  afterEach(() => {
    // モックをリセット
    vi.clearAllMocks();
  });

  describe('getAllApps', () => {
    it('アプリ一覧を取得できること', async () => {
      const apps = await appService.getAllApps();
      
      expect(mockGetApps).toHaveBeenCalledWith(0, 100);
      expect(apps).toHaveLength(2);
      expect(apps[0].appId).toBe('1');
      expect(apps[1].name).toBe('App 2');
    });

    it('ページネーションパラメータが正しく渡されること', async () => {
      await appService.getAllApps(10, 50);
      expect(mockGetApps).toHaveBeenCalledWith(10, 50);
    });
    
    it('キャッシュが機能していること', async () => {
      // 1回目の呼び出し
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(1);
      
      // 2回目の呼び出し（キャッシュから取得されるはず）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(1); // APIは1回だけ呼ばれる
      
      // キャッシュをクリア
      appService.clearCache();
      
      // 3回目の呼び出し（キャッシュがクリアされたのでAPIが呼ばれる）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchApps', () => {
    it('名前で検索できること', async () => {
      const apps = await appService.searchApps({ name: 'App 1' });
      
      expect(apps).toHaveLength(1);
      expect(apps[0].appId).toBe('1');
    });
    
    it('スペースIDで検索できること', async () => {
      const apps = await appService.searchApps({ spaceIds: ['20'] });
      
      expect(apps).toHaveLength(1);
      expect(apps[0].appId).toBe('2');
    });
    
    it('複数の条件で検索できること', async () => {
      // App 1はspaceId='10'
      const apps = await appService.searchApps({ 
        name: 'App', 
        spaceIds: ['10'] 
      });
      
      expect(apps).toHaveLength(1);
      expect(apps[0].appId).toBe('1');
    });
  });

  describe('getAppDetails', () => {
    it('アプリ詳細情報を取得できること', async () => {
      const appDetails = await appService.getAppDetails(1);
      
      expect(appDetails.appInfo).toBeDefined();
      expect(appDetails.fields).toBeDefined();
      expect(appDetails.layout).toBeDefined();
      expect(appDetails.views).toBeDefined();
      expect(appDetails.customize).toBeDefined();
      
      expect(appDetails.appInfo.appId).toBe('1');
      expect(Object.keys(appDetails.fields)).toContain('field1');
      expect(appDetails.layout.layout[0].type).toBe('ROW');
      expect(appDetails.views.views.view1.name).toBe('View 1');
      expect(appDetails.customize.desktop.js[0].url).toBe('https://example.com/script.js');
    });
    
    it('キャッシュが機能していること', async () => {
      // 1回目の呼び出し
      await appService.getAppDetails(1);
      
      // 2回目の呼び出し（キャッシュから取得されるはず）
      await appService.getAppDetails(1);
      
      // すべてのAPIが1回ずつしか呼ばれないこと
      expect(mockGetApp).toHaveBeenCalledTimes(1);
      expect(mockGetFormFields).toHaveBeenCalledTimes(1);
      expect(mockGetFormLayout).toHaveBeenCalledTimes(1);
      expect(mockGetViews).toHaveBeenCalledTimes(1);
      expect(mockGetAppCustomize).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAppFormFields', () => {
    it('フィールド情報を取得できること', async () => {
      const fields = await appService.getAppFormFields(1);
      
      expect(mockGetFormFields).toHaveBeenCalledWith(1, undefined, undefined);
      expect(fields).toHaveProperty('field1');
      expect(fields).toHaveProperty('field2');
      expect(fields.field1.type).toBe('SINGLE_LINE_TEXT');
    });

    it('オプションパラメータが正しく渡されること', async () => {
      await appService.getAppFormFields(1, 'ja', true);
      expect(mockGetFormFields).toHaveBeenCalledWith(1, 'ja', true);
    });
  });

  describe('getAppFormLayout', () => {
    it('レイアウト情報を取得できること', async () => {
      const layout = await appService.getAppFormLayout(1);
      
      expect(mockGetFormLayout).toHaveBeenCalledWith(1, undefined);
      expect(layout.layout).toHaveLength(1);
      expect(layout.layout[0].type).toBe('ROW');
    });

    it('プレビューパラメータが正しく渡されること', async () => {
      await appService.getAppFormLayout(1, true);
      expect(mockGetFormLayout).toHaveBeenCalledWith(1, true);
    });
  });

  describe('getAppViews', () => {
    it('ビュー情報を取得できること', async () => {
      const views = await appService.getAppViews(1);
      
      expect(mockGetViews).toHaveBeenCalledWith(1, undefined, undefined);
      expect(views.views).toHaveProperty('view1');
      expect(views.views.view1.name).toBe('View 1');
    });

    it('オプションパラメータが正しく渡されること', async () => {
      await appService.getAppViews(1, 'ja', true);
      expect(mockGetViews).toHaveBeenCalledWith(1, 'ja', true);
    });
  });
  
  describe('getAppCustomize', () => {
    it('カスタマイズ情報を取得できること', async () => {
      const customize = await appService.getAppCustomize(1);
      
      expect(mockGetAppCustomize).toHaveBeenCalledWith(1, undefined);
      expect(customize.desktop.js[0].url).toBe('https://example.com/script.js');
    });
    
    it('プレビューパラメータが正しく渡されること', async () => {
      await appService.getAppCustomize(1, true);
      expect(mockGetAppCustomize).toHaveBeenCalledWith(1, true);
    });
  });
  
  describe('exportAppSchema', () => {
    it('アプリスキーマをエクスポートできること', async () => {
      const schema = await appService.exportAppSchema(1);
      
      expect(schema.appId).toBe('1');
      expect(schema.name).toBe('App 1');
      expect(schema.fields).toBeDefined();
      expect(schema.layout).toBeDefined();
      expect(schema.views).toBeDefined();
      expect(schema.customize).toBeDefined();
      expect(schema.exportedAt).toBeDefined();
      expect(schema.exportedBy).toEqual({
        code: 'SYSTEM',
        name: 'App Version Controller',
      });
    });
  });
  
  describe('compareAppSchemas', () => {
    it('2つのスキーマを比較して違いを検出できること', () => {
      // テスト用のスキーマを作成
      const schema1: AppSchema = {
        appId: '1',
        name: 'App 1 Old',
        fields: {
          field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1' },
          field2: { type: 'NUMBER', code: 'field2', label: 'Field 2' },
        },
        layout: {
          layout: [{ type: 'ROW', code: 'row1', fields: [{ type: 'SINGLE_LINE_TEXT', code: 'field1' }] }]
        },
        views: {
          views: {
            view1: { id: 'view1', name: 'View 1', type: 'LIST', fields: ['field1'] }
          }
        },
        exportedAt: '2025-01-01T00:00:00Z',
        exportedBy: { code: 'user1', name: 'User 1' },
      };
      
      const schema2: AppSchema = {
        appId: '1',
        name: 'App 1 New',
        fields: {
          field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1 Updated' }, // 変更
          field3: { type: 'DATE', code: 'field3', label: 'Field 3' }, // 追加
          // field2 が削除
        },
        layout: {
          layout: [{ type: 'ROW', code: 'row1', fields: [{ type: 'SINGLE_LINE_TEXT', code: 'field1' }] }]
        },
        views: {
          views: {
            view1: { id: 'view1', name: 'View 1 Updated', type: 'LIST', fields: ['field1'] }, // 変更
            view2: { id: 'view2', name: 'View 2', type: 'CALENDAR', fields: ['field3'] }, // 追加
          }
        },
        exportedAt: '2025-01-02T00:00:00Z',
        exportedBy: { code: 'user2', name: 'User 2' },
      };
      
      const result = appService.compareAppSchemas(schema1, schema2);
      
      // 検証
      expect(result.appId1).toBe('1');
      expect(result.appId2).toBe('1');
      expect(result.differences).toHaveLength(5); // 5つの違いがあるはず
      
      // 統計情報の検証
      expect(result.stats.fieldsAdded).toBe(1);   // field3 が追加
      expect(result.stats.fieldsRemoved).toBe(1); // field2 が削除
      expect(result.stats.fieldsModified).toBe(1); // field1 が変更
      expect(result.stats.viewChanges).toBe(2);    // view1 が変更、view2 が追加
      expect(result.stats.totalChanges).toBe(5);
    });
  });
  
  describe('キャッシュ制御', () => {
    it('キャッシュを無効化できること', async () => {
      // 最初の呼び出し
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(1);
      
      // キャッシュを無効化
      appService.setCacheEnabled(false);
      
      // 2回目の呼び出し（キャッシュが無効なのでAPIが呼ばれる）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(2);
      
      // キャッシュを再度有効化
      appService.setCacheEnabled(true);
      
      // 3回目の呼び出し（キャッシュはリセットされているのでAPIが呼ばれる）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(3);
      
      // 4回目の呼び出し（キャッシュから取得されるはず）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(3);
    });
    
    it('キャッシュをクリアできること', async () => {
      // 最初の呼び出し
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(1);
      
      // キャッシュをクリア
      appService.clearCache();
      
      // 2回目の呼び出し（キャッシュがクリアされたのでAPIが呼ばれる）
      await appService.getAllApps();
      expect(mockGetApps).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('エラーハンドリング', () => {
    it('未実装のメソッドは適切なエラーをスローすること', async () => {
      await expect(appService.getAppAcl(1)).rejects.toThrow('アクセス権情報取得機能は未実装です');
      await expect(appService.getAppSettings(1)).rejects.toThrow('アプリ設定情報取得機能は未実装です');
    });
  });
});
