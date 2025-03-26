/**
 * キャッシュユーティリティ
 * メモリキャッシュの実装
 */

import { CacheOptions } from '../types';

/**
 * キャッシュアイテム
 */
interface CacheItem<T> {
  value: T;
  expires: number; // 有効期限のタイムスタンプ
}

/**
 * メモリキャッシュクラス
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheItem<T>>;
  private options: CacheOptions;

  /**
   * コンストラクタ
   * @param options キャッシュオプション
   */
  constructor(options: Partial<CacheOptions> = {}) {
    this.cache = new Map<string, CacheItem<T>>();
    this.options = {
      enabled: options.enabled !== undefined ? options.enabled : true,
      ttl: options.ttl || 5 * 60 * 1000, // デフォルト5分
    };
  }

  /**
   * キャッシュに値を設定する
   * @param key キャッシュキー
   * @param value 値
   * @param ttl 有効期限（ミリ秒）、指定しない場合はデフォルト値
   */
  set(key: string, value: T, ttl?: number): void {
    if (!this.options.enabled) return;

    const actualTtl = ttl || this.options.ttl;
    const expires = Date.now() + actualTtl;
    
    this.cache.set(key, { value, expires });
  }

  /**
   * キャッシュから値を取得する
   * @param key キャッシュキー
   * @returns キャッシュに値がある場合はその値、ない場合はnull
   */
  get(key: string): T | null {
    if (!this.options.enabled) return null;

    const item = this.cache.get(key);
    
    // キャッシュが存在しない場合
    if (!item) return null;
    
    // 有効期限切れの場合
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * キャッシュを削除する
   * @param key キャッシュキー
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * キャッシュをすべて削除する
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * キャッシュアイテムの数を取得する
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 有効期限切れのキャッシュを削除する
   */
  cleanExpired(): void {
    if (!this.options.enabled) return;

    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * キャッシュの有効／無効を設定する
   * @param enabled 有効にする場合はtrue
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    
    // 無効化される場合は全てのキャッシュをクリア
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * デフォルトのTTLを設定する
   * @param ttl 有効期限（ミリ秒）
   */
  setDefaultTtl(ttl: number): void {
    this.options.ttl = ttl;
  }
}

// シングルトンインスタンス
export const appCache = new MemoryCache();
