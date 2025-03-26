/**
 * アプリ一覧バックアップ処理のテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { AppListBackup } from './app-list-backup';

describe('AppListBackup', () => {
  it('should create instance', () => {
    const backup = new AppListBackup();
    expect(backup).toBeInstanceOf(AppListBackup);
  });

  // 今後テストを追加予定
});
