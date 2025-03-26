/**
 * API通信クライアントのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiClientError } from './api-client';

// KintoneRestAPIClientのモック
const mockAppGetApps = vi.fn();
const mockAppGetApp = vi.fn();
const mockAppGetFormFields = vi.fn();
const mockAppGetFormLayout = vi.fn();
const mockAppGetViews = vi.fn();
const mockAppGetAppCustomize = vi.fn();
const mockRecordGetRecords = vi.fn();
const mockRecordAddRecord = vi.fn();
const mockRecordUpdateRecord = vi.fn();
const mockRecordAddRecords = vi.fn();
const mockRecordUpdateRecords = vi.fn();

vi.mock('@kintone/rest-api-client', () => {
  return {
    KintoneRestAPIClient: vi.fn().mockImplementation(() => {
      return {
        app: {
          getApps: mockAppGetApps,
          getApp: mockAppGetApp,
          getFormFields: mockAppGetFormFields,
          getFormLayout: mockAppGetFormLayout,
          getViews: mockAppGetViews,
          getAppCustomize: mockAppGetAppCustomize
        },
        record: {
          getRecords: mockRecordGetRecords,
          addRecord: mockRecordAddRecord,
          updateRecord: mockRecordUpdateRecord,
          addRecords: mockRecordAddRecords,
          updateRecords: mockRecordUpdateRecords
        }
      };
    }),
  };
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    // テスト用のモックデータを設定
    mockAppGetApps.mockResolvedValue({
      apps: [
        { appId: '1', name: 'App 1', description: 'Description 1' },
        { appId: '2', name: 'App 2', description: 'Description 2' },
      ],
    });
    mockAppGetApp.mockResolvedValue({
      appId: '1',
      name: 'App 1',
      description: 'App description',
      spaceId: '10',
      threadId: '100',
    });
    mockAppGetFormFields.mockResolvedValue({
      properties: {
        field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1' },
        field2: { type: 'NUMBER', code: 'field2', label: 'Field 2' },
      }
    });
    mockAppGetFormLayout.mockResolvedValue({
      layout: [
        { type: 'ROW', fields: [{ type: 'SINGLE_LINE_TEXT', code: 'field1' }] }
      ]
    });
    mockAppGetViews.mockResolvedValue({
      views: {
        view1: { id: 'view1', name: 'View 1', type: 'LIST', fields: ['field1'] }
      }
    });
    mockRecordGetRecords.mockResolvedValue({
      records: [
        { $id: { value: '1' }, field1: { value: 'value1' } }
      ]
    });
    mockRecordAddRecord.mockResolvedValue({
      id: '1',
      revision: '1'
    });
    mockRecordUpdateRecord.mockResolvedValue({
      revision: '2'
    });
    mockRecordAddRecords.mockResolvedValue({
      ids: ['1', '2'],
      revisions: ['1', '1']
    });
    mockRecordUpdateRecords.mockResolvedValue({
      records: [
        { id: '1', revision: '2' },
        { id: '2', revision: '2' }
      ]
    });
    mockAppGetAppCustomize.mockResolvedValue({
      desktop: { js: [], css: [] },
      mobile: { js: [], css: [] }
    });

    apiClient = new ApiClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getApps', () => {
    it('アプリ一覧を正しく取得できること', async () => {
      const apps = await apiClient.getApps();
      expect(mockAppGetApps).toHaveBeenCalledWith({ offset: 0, limit: 100 });
      expect(apps).toHaveLength(2);
      expect(apps[0].appId).toBe('1');
      expect(apps[0].name).toBe('App 1');
      expect(apps[1].appId).toBe('2');
    });

    it('ページネーションパラメータが正しく渡されること', async () => {
      await apiClient.getApps(10, 20);
      expect(mockAppGetApps).toHaveBeenCalledWith({ offset: 10, limit: 20 });
    });

    it('エラー時に適切に処理されること', async () => {
      mockAppGetApps.mockRejectedValueOnce({
        code: 'GAIA_NO_PERMISSION',
        message: 'No permission to proceed',
        errors: [{ message: 'Permission denied' }]
      });

      await expect(apiClient.getApps()).rejects.toThrow(ApiClientError);
    });
  });

  describe('getApp', () => {
    it('アプリ詳細を正しく取得できること', async () => {
      const app = await apiClient.getApp(1);
      expect(mockAppGetApp).toHaveBeenCalledWith({ id: 1 });
      expect(app.appId).toBe('1');
      expect(app.name).toBe('App 1');
      expect(app.description).toBe('App description');
      expect(app.spaceId).toBe('10');
      expect(app.threadId).toBe('100');
    });

    it('エラー時に適切に処理されること', async () => {
      mockAppGetApp.mockRejectedValueOnce({
        code: 'GAIA_APP_NOT_FOUND',
        message: 'App not found',
        errors: [{ message: 'The app (ID: 999) not found.' }]
      });

      await expect(apiClient.getApp(999)).rejects.toThrow(ApiClientError);
    });
  });

  describe('getFormFields', () => {
    it('フィールド情報を正しく取得できること', async () => {
      const fields = await apiClient.getFormFields(1);
      expect(mockAppGetFormFields).toHaveBeenCalledWith({ app: 1 });
      expect(fields).toHaveProperty('field1');
      expect(fields).toHaveProperty('field2');
      expect(fields.field1.type).toBe('SINGLE_LINE_TEXT');
    });

    it('オプションパラメータが正しく渡されること', async () => {
      await apiClient.getFormFields(1, 'ja', true);
      expect(mockAppGetFormFields).toHaveBeenCalledWith({
        app: 1,
        lang: 'ja',
        preview: true
      });
    });
  });

  describe('getFormLayout', () => {
    it('レイアウト情報を正しく取得できること', async () => {
      const layout = await apiClient.getFormLayout(1);
      expect(mockAppGetFormLayout).toHaveBeenCalledWith({ app: 1 });
      expect(layout.layout).toHaveLength(1);
      expect(layout.layout[0].type).toBe('ROW');
    });

    it('プレビューパラメータが正しく渡されること', async () => {
      await apiClient.getFormLayout(1, true);
      expect(mockAppGetFormLayout).toHaveBeenCalledWith({
        app: 1,
        preview: true
      });
    });
  });

  describe('getViews', () => {
    it('ビュー情報を正しく取得できること', async () => {
      const views = await apiClient.getViews(1);
      expect(mockAppGetViews).toHaveBeenCalledWith({ app: 1 });
      expect(views.views).toHaveProperty('view1');
      expect(views.views.view1.name).toBe('View 1');
    });

    it('オプションパラメータが正しく渡されること', async () => {
      await apiClient.getViews(1, 'ja', true);
      expect(mockAppGetViews).toHaveBeenCalledWith({
        app: 1,
        lang: 'ja',
        preview: true
      });
    });
  });

  describe('getRecords', () => {
    it('レコード一覧を正しく取得できること', async () => {
      const records = await apiClient.getRecords(1);
      expect(mockRecordGetRecords).toHaveBeenCalledWith({
        app: 1,
        query: '',
        fields: [],
        totalCount: false
      });
      expect(records).toHaveLength(1);
      expect(records[0].$id.value).toBe('1');
    });

    it('クエリとフィールドパラメータが正しく渡されること', async () => {
      await apiClient.getRecords(1, 'field1 = "value"', ['field1'], true);
      expect(mockRecordGetRecords).toHaveBeenCalledWith({
        app: 1,
        query: 'field1 = "value"',
        fields: ['field1'],
        totalCount: true
      });
    });
  });

  describe('postRecord', () => {
    it('レコードを正しく登録できること', async () => {
      const result = await apiClient.postRecord(1, { field1: { value: 'value1' } });
      expect(mockRecordAddRecord).toHaveBeenCalledWith({
        app: 1,
        record: { field1: { value: 'value1' } }
      });
      expect(result).toEqual({ id: '1', revision: '1' });
    });
  });

  describe('putRecord', () => {
    it('レコードを正しく更新できること', async () => {
      const result = await apiClient.putRecord(1, 1, { field1: { value: 'updated' } });
      expect(mockRecordUpdateRecord).toHaveBeenCalledWith({
        app: 1,
        id: 1,
        record: { field1: { value: 'updated' } },
        revision: undefined
      });
      expect(result).toEqual({ revision: '2' });
    });

    it('リビジョン指定がある場合に正しく渡されること', async () => {
      await apiClient.putRecord(1, 1, { field1: { value: 'updated' } }, '1');
      expect(mockRecordUpdateRecord).toHaveBeenCalledWith({
        app: 1,
        id: 1,
        record: { field1: { value: 'updated' } },
        revision: '1'
      });
    });
  });

  describe('postRecords', () => {
    it('複数レコードを一括登録できること', async () => {
      const records = [
        { field1: { value: 'value1' } },
        { field1: { value: 'value2' } }
      ];
      const result = await apiClient.postRecords(1, records);
      expect(mockRecordAddRecords).toHaveBeenCalledWith({
        app: 1,
        records
      });
      expect(result).toEqual({ ids: ['1', '2'], revisions: ['1', '1'] });
    });
  });

  describe('putRecords', () => {
    it('複数レコードを一括更新できること', async () => {
      const records = [
        { id: 1, record: { field1: { value: 'updated1' } } },
        { id: 2, record: { field1: { value: 'updated2' } } }
      ];
      const result = await apiClient.putRecords(1, records);
      expect(mockRecordUpdateRecords).toHaveBeenCalledWith({
        app: 1,
        records
      });
      expect(result).toEqual({
        records: [
          { id: '1', revision: '2' },
          { id: '2', revision: '2' }
        ]
      });
    });
  });

  describe('getAppCustomize', () => {
    it('アプリカスタマイズ情報を正しく取得できること', async () => {
      const customize = await apiClient.getAppCustomize(1);
      expect(mockAppGetAppCustomize).toHaveBeenCalledWith({ app: 1 });
      expect(customize).toHaveProperty('desktop');
      expect(customize).toHaveProperty('mobile');
    });

    it('プレビューパラメータが正しく渡されること', async () => {
      await apiClient.getAppCustomize(1, true);
      expect(mockAppGetAppCustomize).toHaveBeenCalledWith({
        app: 1,
        preview: true
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('ApiClientErrorが投げられること', async () => {
      mockAppGetApp.mockRejectedValueOnce({
        code: 'GAIA_NO_PERMISSION',
        message: 'No permission',
        errors: [{ message: 'Permission denied' }]
      });

      try {
        await apiClient.getApp(1);
        // ここに到達しないはず
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        const clientError = error as ApiClientError;
        expect(clientError.statusCode).toBe(403);
        expect(clientError.errors).toEqual([{ message: 'Permission denied' }]);
      }
    });
  });
});
