/**
 * キャッシュユーティリティのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache } from './cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<any>;

  beforeEach(() => {
    // 各テスト前にキャッシュをリセット
    cache = new MemoryCache();
  });

  afterEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('set と get でキャッシュの設定と取得ができること', () => {
    cache.set('test-key', { data: 'test-data' });
    expect(cache.get('test-key')).toEqual({ data: 'test-data' });
  });

  it('存在しないキーの get は null を返すこと', () => {
    expect(cache.get('non-existent')).toBeNull();
  });

  it('delete でキャッシュを削除できること', () => {
    cache.set('test-key', { data: 'test-data' });
    expect(cache.get('test-key')).not.toBeNull();
    
    cache.delete('test-key');
    expect(cache.get('test-key')).toBeNull();
  });

  it('clear ですべてのキャッシュをクリアできること', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size).toBe(2);
    
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('TTLを過ぎると自動的にキャッシュが無効になること', () => {
    // 時間をモック
    vi.useFakeTimers();
    
    // TTLを100ミリ秒に設定
    cache = new MemoryCache({ ttl: 100 });
    cache.set('test-key', 'test-value');
    
    // TTL内ではキャッシュが有効
    expect(cache.get('test-key')).toBe('test-value');
    
    // 101ミリ秒進める
    vi.advanceTimersByTime(101);
    
    // TTL超過でキャッシュが無効になる
    expect(cache.get('test-key')).toBeNull();
  });

  it('個別のTTLを指定できること', () => {
    vi.useFakeTimers();
    
    // デフォルトTTLを100ミリ秒に設定
    cache = new MemoryCache({ ttl: 100 });
    
    // キー1: デフォルトTTL(100ms)
    cache.set('key1', 'value1');
    
    // キー2: カスタムTTL(300ms)
    cache.set('key2', 'value2', 300);
    
    // 150ミリ秒進める
    vi.advanceTimersByTime(150);
    
    // キー1はTTL超過で無効になるが、キー2は有効
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    
    // さらに200ミリ秒進める
    vi.advanceTimersByTime(200);
    
    // キー2もTTL超過で無効になる
    expect(cache.get('key2')).toBeNull();
  });

  it('cache.enabled=false でキャッシュが無効になること', () => {
    // 有効状態
    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
    
    // 無効化
    cache.setEnabled(false);
    
    // 既存のキャッシュはクリアされる
    expect(cache.get('test-key')).toBeNull();
    
    // 新しい値は保存されない
    cache.set('new-key', 'new-value');
    expect(cache.get('new-key')).toBeNull();
    
    // 再度有効化
    cache.setEnabled(true);
    
    // 新しい値が保存される
    cache.set('enabled-key', 'enabled-value');
    expect(cache.get('enabled-key')).toBe('enabled-value');
  });

  it('cleanExpired で期限切れのキャッシュだけを削除できること', () => {
    vi.useFakeTimers();
    
    cache = new MemoryCache({ ttl: 100 });
    
    // key1は短いTTL
    cache.set('key1', 'value1', 50);
    
    // key2は長いTTL
    cache.set('key2', 'value2', 200);
    
    // 70ミリ秒進める
    vi.advanceTimersByTime(70);
    
    // cleanExpiredを呼び出す前はkey1はまだキャッシュに残っている
    expect(cache.size).toBe(2);
    
    // 期限切れのkey1だけをクリア
    cache.cleanExpired();
    
    // key1は削除され、key2は残る
    expect(cache.size).toBe(1);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    
    // さらに時間を進めてkey2も期限切れに
    vi.advanceTimersByTime(150);
    cache.cleanExpired();
    
    // すべてのキーが削除される
    expect(cache.size).toBe(0);
  });
});
