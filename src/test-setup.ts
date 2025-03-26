/* 
 * テスト環境のセットアップファイル
 * Vitestの実行前に読み込まれる
 */

// グローバルなモックやセットアップをここに記述
window.alert = vi.fn();
window.confirm = vi.fn();

// kintoneグローバル変数のモック
global.kintone = {
  events: {
    on: vi.fn(),
    off: vi.fn(),
  },
  api: {
    url: vi.fn().mockReturnValue('/k/v1/'),
  },
  app: {
    getId: vi.fn().mockReturnValue(1),
    getQueryCondition: vi.fn().mockReturnValue(''),
  },
};