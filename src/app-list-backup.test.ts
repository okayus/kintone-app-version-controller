/**
 * アプリ一覧バックアップ処理のテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { AppListBackup } from './app-list-backup';
import { AppService } from './services/app-service';
import { VersionService } from './services/version-service';

// サービスのモック
vi.mock('./services/app-service');
vi.mock('./services/version-service');

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