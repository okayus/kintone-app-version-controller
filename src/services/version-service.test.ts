/**
 * バージョン管理サービスのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VersionService } from './version-service';
import { ApiClient } from '../utils/api-client';
import { AppService } from './app-service';
import { VERSION_FIELD_CODES } from '../constants';
import { VersionInfo, AppDetail } from '../types';

// deep-equalをモック
vi.mock('deep-equal', () => {
  return {
    default: vi.fn().mockReturnValue(false)
  };
});
const deepEqualMock = vi.mocked(vi.importActual('deep-equal')).default;

// VERSION_FIELD_CODESをモック
vi.mock('../constants', () => {
  return {
    APP_IDS: {
      APP_VERSION_CONTROL: 374
    },
    VERSION_FIELD_CODES: {
      APP_ID: 'appId',
      APP_NAME: 'appName',
      VERSION_NUMBER: 'versionNumber',
      CREATED_AT: 'createdAt',
      CREATED_BY: 'createdBy',
      DATA: 'data',
      COMMENT: 'comment'
    }
  };
});

// ApiClientのモック
const mockGetRecords = vi.fn();
const mockPostRecord = vi.fn();

vi.mock('../utils/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getRecords: mockGetRecords,
        postRecord: mockPostRecord,
      };
    }),
  };
});

// AppServiceのモック
vi.mock('./app-service', () => {
  return {
    AppService: vi.fn().mockImplementation(() => {
      return {
        getAppDetails: vi.fn().mockResolvedValue({
          appInfo: { 
            appId: '1', 
            name: 'Current App', 
            description: 'Current Description' 
          },
          fields: { field1: { type: 'SINGLE_LINE_TEXT', code: 'field1' } },
          layout: { layout: [{ type: 'ROW', fields: [{ code: 'field1' }] }] },
          views: { views: { view1: { id: 'view1', name: 'View 1', type: 'LIST', fields: ['field1'] } } }
        }),
      };
    }),
  };
});

// getCurrentUserをモック
vi.mock('../utils/helpers', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCurrentUser: vi.fn().mockReturnValue({ code: 'test_user', name: 'Test User' }),
    getCurrentTimestamp: vi.fn().mockReturnValue('2025-03-26T10:00:00Z'),
  };
});

// サンプルバージョン情報の作成
const createSampleVersions = () => {
  const version1: VersionInfo = {
    versionNumber: 1,  // 文字列から数値に変更
    createdAt: '2025-03-25T10:00:00Z',
    createdBy: { code: 'user1', name: 'User 1' },
    data: {
      appInfo: { appId: '1', name: 'App 1', description: 'Version 1' },
      fields: { field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1' } },
      layout: { layout: [{ type: 'ROW', fields: [{ code: 'field1' }] }] },
      views: { views: { view1: { id: 'view1', name: 'View 1', type: 'LIST', fields: ['field1'] } } }
    },
    comment: 'Initial version'
  };
  
  const version2: VersionInfo = {
    versionNumber: 2,  // 文字列から数値に変更
    createdAt: '2025-03-26T10:00:00Z',
    createdBy: { code: 'user1', name: 'User 1' },
    data: {
      appInfo: { appId: '1', name: 'App 1', description: 'Version 2' },
      fields: { 
        field1: { type: 'SINGLE_LINE_TEXT', code: 'field1', label: 'Field 1 Updated' },
        field2: { type: 'NUMBER', code: 'field2', label: 'Field 2' }
      },
      layout: { layout: [{ type: 'ROW', fields: [{ code: 'field1' }, { code: 'field2' }] }] },
      views: { views: { view1: { id: 'view1', name: 'View 1', type: 'LIST', fields: ['field1', 'field2'] } } }
    },
    comment: 'Updated fields'
  };
  
  return { version1, version2 };
};

describe('VersionService', () => {
  let versionService: VersionService;
  const { version1, version2 } = createSampleVersions();

  beforeEach(() => {
    // レコード取得のモック実装
    mockGetRecords.mockImplementation((appId, query) => {
      // 最新バージョン取得
      if (query.includes('limit 1')) {
        return Promise.resolve([{
          $id: { value: '1001' },
          appId: { value: '1' },
          appName: { value: 'App 1' },
          versionNumber: { value: 2 },  // 数値に変更
          createdAt: { value: '2025-03-26T10:00:00Z' },
          createdBy: { value: [{ code: 'user1', name: 'User 1' }] },
          data: { value: JSON.stringify(version2.data) },
          comment: { value: 'Updated fields' }
        }]);
      }
      // バージョン履歴取得
      else if (query.includes('order by')) {
        return Promise.resolve([
          {
            $id: { value: '1001' },
            appId: { value: '1' },
            appName: { value: 'App 1' },
            versionNumber: { value: 2 },  // 数値に変更
            createdAt: { value: '2025-03-26T10:00:00Z' },
            createdBy: { value: [{ code: 'user1', name: 'User 1' }] },
            data: { value: JSON.stringify(version2.data) },
            comment: { value: 'Updated fields' }
          },
          {
            $id: { value: '1000' },
            appId: { value: '1' },
            appName: { value: 'App 1' },
            versionNumber: { value: 1 },  // 数値に変更
            createdAt: { value: '2025-03-25T10:00:00Z' },
            createdBy: { value: [{ code: 'user1', name: 'User 1' }] },
            data: { value: JSON.stringify(version1.data) },
            comment: { value: 'Initial version' }
          },
        ]);
      }
      // レコードID指定の取得
      else if (query.includes('$id')) {
        const recordId = query.match(/\$id = \"([^\"]+)\"/)[1];
        
        if (recordId === '1000') {
          return Promise.resolve([{
            $id: { value: '1000' },
            appId: { value: '1' },
            appName: { value: 'App 1' },
            versionNumber: { value: 1 },  // 数値に変更
            createdAt: { value: '2025-03-25T10:00:00Z' },
            createdBy: { value: [{ code: 'user1', name: 'User 1' }] },
            data: { value: JSON.stringify(version1.data) },
            comment: { value: 'Initial version' }
          }]);
        } else if (recordId === '1001') {
          return Promise.resolve([{
            $id: { value: '1001' },
            appId: { value: '1' },
            appName: { value: 'App 1' },
            versionNumber: { value: 2 },  // 数値に変更
            createdAt: { value: '2025-03-26T10:00:00Z' },
            createdBy: { value: [{ code: 'user1', name: 'User 1' }] },
            data: { value: JSON.stringify(version2.data) },
            comment: { value: 'Updated fields' }
          }]);
        } else {
          return Promise.resolve([]);
        }
      }
      // その他のケース
      return Promise.resolve([]);
    });
    
    // レコード作成のモック実装
    mockPostRecord.mockResolvedValue({
      id: '1002',
      revision: '1'
    });
    
    versionService = new VersionService();
    
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getLatestVersion', () => {
    it('最新バージョンを取得できること', async () => {
      const version = await versionService.getLatestVersion(1);
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        'appId = "1" order by createdAt desc limit 1'
      );
      
      expect(version).not.toBeNull();
      expect(version?.versionNumber).toBe(2);  // 文字列ではなく数値になっていることを確認
      expect(version?.createdAt).toBe('2025-03-26T10:00:00Z');
      expect(version?.data.appInfo.description).toBe('Version 2');
    });
    
    it('バージョンがない場合はnullを返すこと', async () => {
      mockGetRecords.mockResolvedValueOnce([]);
      
      const version = await versionService.getLatestVersion(999);
      expect(version).toBeNull();
    });
  });

  describe('getVersionHistory', () => {
    it('バージョン履歴を取得できること', async () => {
      const history = await versionService.getVersionHistory(1);
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        'appId = "1" order by createdAt desc limit 10'
      );
      
      expect(history).toHaveLength(2);
      expect(history[0].versionNumber).toBe(2);  // 文字列ではなく数値になっていることを確認
      expect(history[1].versionNumber).toBe(1);  // 文字列ではなく数値になっていることを確認
    });
    
    it('limit引数を指定できること', async () => {
      await versionService.getVersionHistory(1, 5);
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        'appId = "1" order by createdAt desc limit 5'
      );
    });
  });

  describe('getVersionSummaries', () => {
    it('バージョン概要一覧を取得できること', async () => {
      const summaries = await versionService.getVersionSummaries(1);
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        'appId = "1" order by createdAt desc limit 20',
        ['versionNumber', 'createdAt', 'createdBy', 'comment', 'appId', 'appName']
      );
      
      expect(summaries).toHaveLength(2);
      expect(summaries[0].versionNumber).toBe(2);  // 文字列ではなく数値になっていることを確認
      expect(summaries[0].appName).toBe('App 1');
      expect(summaries[0].recordId).toBe('1001');
    });
  });

  describe('compareAppVersions', () => {
    it('変更がある場合はtrueを返すこと', async () => {
      const appDetails: AppDetail = {
        appInfo: { appId: '1', name: 'App 1', description: 'Changed Description' },
        fields: {},
        layout: { layout: [] },
        views: { views: {} }
      };
      
      const hasChanges = await versionService.compareAppVersions(1, appDetails);
      expect(hasChanges).toBe(true);
    });
    
    it('変更がない場合はfalseを返すこと', async () => {
      // テスト用にモックの値を一時的に変更
      deepEqualMock.mockReturnValueOnce(true);
      
      const appDetails = { ...version2.data };
      const hasChanges = await versionService.compareAppVersions(1, appDetails);
      expect(hasChanges).toBe(false);
    });
  });

  describe('createNewVersion', () => {
    it('新しいバージョンを作成できること', async () => {
      const appDetails: AppDetail = {
        appInfo: { appId: '1', name: 'App 1', description: 'New Version' },
        fields: { field1: { type: 'SINGLE_LINE_TEXT', code: 'field1' } },
        layout: { layout: [] },
        views: { views: {} }
      };
      
      const newVersion = await versionService.createNewVersion(1, appDetails, 'Test comment');
      
      expect(mockPostRecord).toHaveBeenCalledWith(
        374,
        expect.objectContaining({
          appId: { value: '1' },
          appName: { value: 'App 1' },
          versionNumber: { value: 3 },  // 数値で指定
          comment: { value: 'Test comment' }
        })
      );
      
      expect(newVersion.versionNumber).toBe(3);  // 文字列ではなく数値になっていることを確認
      expect(newVersion.comment).toBe('Test comment');
      expect(newVersion.data).toEqual(appDetails);
    });
    
    it('コメントが指定されない場合はデフォルトのコメントを使用すること', async () => {
      const appDetails: AppDetail = {
        appInfo: { appId: '1', name: 'App 1', description: 'New Version' },
        fields: {},
        layout: { layout: [] },
        views: { views: {} }
      };
      
      await versionService.createNewVersion(1, appDetails);
      
      expect(mockPostRecord).toHaveBeenCalledWith(
        374,
        expect.objectContaining({
          comment: { value: expect.stringContaining('App 1') }
        })
      );
    });
  });

  describe('getVersionById', () => {
    it('指定されたレコードIDのバージョン情報を取得できること', async () => {
      const version = await versionService.getVersionById('1000');
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        '$id = "1000"',
        []
      );
      
      expect(version).not.toBeNull();
      expect(version?.versionNumber).toBe(1);  // 文字列ではなく数値になっていることを確認
      expect(version?.createdAt).toBe('2025-03-25T10:00:00Z');
      expect(version?.data.appInfo.description).toBe('Version 1');
    });
    
    it('存在しないレコードIDの場合はnullを返すこと', async () => {
      const version = await versionService.getVersionById('9999');
      expect(version).toBeNull();
    });
  });

  describe('generateDiff', () => {
    it('バージョン間の差分を生成できること', () => {
      const diffs = versionService.generateDiff(version1, version2);
      expect(diffs.length).toBeGreaterThan(0);
      
      // description変更の差分を検証
      const descriptionDiff = diffs.find(d => d.path.includes('description'));
      expect(descriptionDiff).toBeDefined();
      expect(descriptionDiff?.oldValue).toBe('Version 1');
      expect(descriptionDiff?.newValue).toBe('Version 2');
      expect(descriptionDiff?.changeType).toBe('modified');
      
      // field2追加の差分を検証
      const field2Diff = diffs.find(d => d.path.includes('field2'));
      expect(field2Diff).toBeDefined();
      expect(field2Diff?.changeType).toBe('added');
    });
  });

  describe('compareVersions', () => {
    it('2つのバージョンを比較して結果を返すこと', async () => {
      const result = await versionService.compareVersions('1000', '1001');
      
      expect(result.oldVersion.versionNumber).toBe(1);  // 文字列ではなく数値になっていることを確認
      expect(result.newVersion.versionNumber).toBe(2);  // 文字列ではなく数値になっていることを確認
      expect(result.diffs.length).toBeGreaterThan(0);
      expect(result.diffStats).toEqual(expect.objectContaining({
        total: expect.any(Number)
      }));
      expect(result.diffText).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('restoreVersion', () => {
    it('指定されたバージョンを復元できること', async () => {
      const result = await versionService.restoreVersion('1000');
      
      expect(result.success).toBe(true);
      expect(result.version.versionNumber).toBe(3);  // 文字列ではなく数値になっていることを確認
      expect(result.recordId).toBe('1000');
      expect(result.backupTimestamp).toBeDefined();
      
      expect(mockPostRecord).toHaveBeenCalledWith(
        374,
        expect.objectContaining({
          comment: { value: expect.stringContaining('バージョン 1 からの復元') }
        })
      );
    });
    
    it('オプションを指定して部分的に復元できること', async () => {
      const options = {
        restoreFields: true,
        restoreLayout: false,
        restoreViews: false,
        comment: 'カスタム復元コメント'
      };
      
      const result = await versionService.restoreVersion('1000', options);
      
      expect(result.success).toBe(true);
      expect(mockPostRecord).toHaveBeenCalledWith(
        374,
        expect.objectContaining({
          comment: { value: 'カスタム復元コメント' }
        })
      );
    });
  });

  describe('getVersionsByDateRange', () => {
    it('日付範囲でバージョンを取得できること', async () => {
      const startDate = '2025-03-25T00:00:00Z';
      const endDate = '2025-03-26T23:59:59Z';
      
      const versions = await versionService.getVersionsByDateRange(1, startDate, endDate);
      
      expect(mockGetRecords).toHaveBeenCalledWith(
        374,
        `appId = "1" and createdAt >= "${startDate}" and createdAt <= "${endDate}" order by createdAt desc`
      );
      
      expect(versions).toHaveLength(2);
    });
  });
});
