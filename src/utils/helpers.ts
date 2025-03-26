/**
 * ヘルパー関数群
 */

/**
 * オブジェクトの深いクローンを作成する
 * @param obj クローン対象のオブジェクト
 * @returns クローンされたオブジェクト
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 指定されたミリ秒待機する
 * @param ms 待機ミリ秒
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * キントーンレコードを通常のオブジェクトに変換する
 * @param record キントーンレコード
 * @returns 通常のオブジェクト
 */
export function normalizeRecord(record: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  
  for (const [fieldCode, field] of Object.entries(record)) {
    if ('value' in field) {
      normalized[fieldCode] = field.value;
    }
  }
  
  return normalized;
}

/**
 * 通常のオブジェクトをキントーンレコード形式に変換する
 * @param obj 通常のオブジェクト
 * @returns キントーンレコード形式のオブジェクト
 */
export function toKintoneRecord(obj: Record<string, any>): Record<string, { value: any }> {
  const record: Record<string, { value: any }> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    record[key] = { value };
  }
  
  return record;
}

/**
 * 文字列を指定された長さに省略する
 * @param str 対象の文字列
 * @param length 最大長
 * @param suffix 省略時のサフィックス
 * @returns 省略された文字列
 */
export function truncateString(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) {
    return str;
  }
  
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * バージョン番号を生成する（メジャー.マイナー.パッチ）
 * @param currentVersion 現在のバージョン
 * @param type 更新タイプ
 * @returns 新しいバージョン番号
 */
export function generateVersionNumber(
  currentVersion = '0.0.0',
  type: 'major' | 'minor' | 'patch' = 'patch'
): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * 現在のタイムスタンプを生成する（ISO形式）
 * @returns ISO形式のタイムスタンプ
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
