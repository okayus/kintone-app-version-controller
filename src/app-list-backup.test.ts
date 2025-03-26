/**
 * アプリ一覧バックアップ処理のテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { AppListBackup } from './app-list-backup';
import { AppService } from './services/app-service';
import { VersionService } from './services/version-service';

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

// サービスのモック
vi.mock('./services/app-service');
vi.mock('./services/version-service');

// kintoneのグローバルオブジェクトをモック
global.kintone = {
  events: {
    on: vi.fn()
  }
};

describe('AppListBackup', () => {
  it('should create instance', () => {
    // モックサービスを使用
    const mockAppService = new AppService() as jest.Mocked<AppService>;
    const mockVersionService = new VersionService() as jest.Mocked<VersionService>;
    
    const backup = new AppListBackup(mockAppService, mockVersionService);
    expect(backup).toBeInstanceOf(AppListBackup);
  });
  
  // 今後テストを追加予定
});
