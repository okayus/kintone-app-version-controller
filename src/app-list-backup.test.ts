/**
 * アプリ一覧バックアップ処理のテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppListBackup } from './app-list-backup';
import { AppService } from './services/app-service';
import { VersionService } from './services/version-service';
import { CUSTOMIZE_IDS } from './constants';

// モックのインポート
import { sleep } from './utils/helpers';
import { logError, logInfo } from './utils/logger';

// sleep関数をモック
vi.mock('./utils/helpers', () => ({
  sleep: vi.fn(() => Promise.resolve())
}));

// ロガーをモック
vi.mock('./utils/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn()
}));

// constants モジュールのモック
vi.mock('./constants', () => {
  return {
    APP_IDS: {
      APP_LIST: 382,
      APP_VERSION_CONTROL: 374
    },
    EVENT_TYPES: {
      INDEX_SHOW: 'app.record.index.show',
      DETAIL_SHOW: 'app.record.detail.show',
      CREATE_SHOW: 'app.record.create.show',
      EDIT_SHOW: 'app.record.edit.show'
    },
    CUSTOMIZE_IDS: {
      BACKUP_BUTTON: 'app-list-backup-button',
      PROGRESS_INDICATOR: 'app-list-backup-progress'
    }
  };
});

// コンポーネントをモック
vi.mock('./components', () => {
  return {
    createButton: vi.fn(() => {
      const button = document.createElement('button');
      button.id = CUSTOMIZE_IDS.BACKUP_BUTTON;
      return button;
    }),
    Notification: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    },
    ProgressIndicator: vi.fn().mockImplementation(() => {
      const container = document.createElement('div');
      return {
        container,
        setValue: vi.fn(),
        remove: vi.fn(),
      };
    })
  };
});

// サービスのモック
vi.mock('./services/app-service');
vi.mock('./services/version-service');

// DOMのモックセットアップ関数
function setupMockDOM() {
  // ヘッダーメニュー要素
  const headerMenu = document.createElement('div');
  headerMenu.className = 'gaia-argoui-app-toolbar-menu';
  document.body.appendChild(headerMenu);

  // コンテンツ要素
  const content = document.createElement('div');
  content.className = 'gaia-argoui-app-content';
  document.body.appendChild(content);

  return { headerMenu, content };
}

// kintoneのグローバルオブジェクトをモック
global.kintone = {
  events: {
    on: vi.fn()
  }
};

// windowのconfirmメソッドをモック
global.confirm = vi.fn(() => true);

describe('AppListBackup', () => {
  let mockAppService: any;
  let mockVersionService: any;
  let backup: AppListBackup;
  
  beforeEach(() => {
    // DOMをセットアップ
    setupMockDOM();
    
    // モックサービスを作成
    mockAppService = new AppService() as any;
    mockVersionService = new VersionService() as any;
    
    // モックメソッドをセットアップ
    mockAppService.getAllApps = vi.fn().mockResolvedValue([
      { appId: '1', name: 'テストアプリ1' },
      { appId: '2', name: 'テストアプリ2' }
    ]);
    mockAppService.getAppDetails = vi.fn().mockImplementation((appId) => 
      Promise.resolve({ appId, name: `テストアプリ${appId}`, fields: {} })
    );
    mockVersionService.compareAppVersions = vi.fn().mockResolvedValue(true);
    mockVersionService.createNewVersion = vi.fn().mockResolvedValue({ success: true });
    
    // インスタンスを作成
    backup = new AppListBackup(mockAppService, mockVersionService);
    
    // モックのリセット
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // DOMのクリーンアップ
    document.body.innerHTML = '';
  });
  
  it('should create instance', () => {
    expect(backup).toBeInstanceOf(AppListBackup);
  });
  
  it('should add backup button to header menu', () => {
    const { headerMenu } = setupMockDOM();
    
    backup.addBackupButton();
    
    const button = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON);
    expect(button).not.toBeNull();
    expect(headerMenu.contains(button)).toBe(true);
    expect(logInfo).toHaveBeenCalledWith('バックアップボタンが追加されました');
  });
  
  it('should log error if header menu not found', () => {
    document.body.innerHTML = ''; // Clear DOM
    
    backup.addBackupButton();
    
    expect(logError).toHaveBeenCalledWith('ヘッダーメニュー要素が見つかりません');
  });
  
  it('should execute backup process successfully', async () => {
    const result = await backup.executeBackup();
    
    expect(mockAppService.getAllApps).toHaveBeenCalledTimes(1);
    expect(mockAppService.getAppDetails).toHaveBeenCalledTimes(2);
    expect(mockVersionService.compareAppVersions).toHaveBeenCalledTimes(2);
    expect(mockVersionService.createNewVersion).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(2);
    
    expect(result).toEqual({ total: 2, updated: 2, error: 0 });
    expect(logInfo).toHaveBeenCalledWith('バックアップ処理が完了しました。合計: 2、更新: 2、エラー: 0');
  });
  
  it('should handle errors during app processing', async () => {
    // 2つ目のアプリでエラーが発生するようにモック
    mockAppService.getAppDetails = vi.fn().mockImplementation((appId) => {
      if (appId === 2) {
        return Promise.reject(new Error('テストエラー'));
      }
      return Promise.resolve({ appId, name: `テストアプリ${appId}`, fields: {} });
    });
    
    const result = await backup.executeBackup();
    
    expect(mockAppService.getAllApps).toHaveBeenCalledTimes(1);
    expect(mockAppService.getAppDetails).toHaveBeenCalledTimes(2);
    expect(mockVersionService.compareAppVersions).toHaveBeenCalledTimes(1);
    expect(mockVersionService.createNewVersion).toHaveBeenCalledTimes(1);
    
    expect(result).toEqual({ total: 2, updated: 1, error: 1 });
    expect(logError).toHaveBeenCalledWith(
      'アプリ "テストアプリ2" (ID: 2) の処理中にエラーが発生しました: テストエラー',
      expect.any(Error)
    );
  });
  
  it('should handle empty app list', async () => {
    mockAppService.getAllApps = vi.fn().mockResolvedValue([]);
    
    const result = await backup.executeBackup();
    
    expect(result).toEqual({ total: 0, updated: 0 });
  });
  
  it('should handle fatal errors', async () => {
    mockAppService.getAllApps = vi.fn().mockRejectedValue(new Error('致命的なエラー'));
    
    await expect(backup.executeBackup()).rejects.toThrow('致命的なエラー');
    expect(logError).toHaveBeenCalledWith(
      'バックアップ処理の実行中に致命的なエラーが発生しました',
      expect.any(Error)
    );
  });
});
