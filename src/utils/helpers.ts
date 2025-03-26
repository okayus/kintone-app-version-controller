/**
 * ヘルパー関数群
 */
import * as diff from 'diff';
import { VersionDiff } from '../types';

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
 * バージョン番号を生成する（自然数のインクリメント）
 * @param currentVersion 現在のバージョン
 * @returns 新しいバージョン番号（文字列）
 */
export function generateVersionNumber(currentVersion: string | number = 0): string {
  // 数値に変換
  let versionNum: number;
  
  if (typeof currentVersion === 'number') {
    versionNum = currentVersion;
  } else {
    versionNum = parseInt(currentVersion, 10);
  }
  
  // NaNの場合は1を返す
  if (isNaN(versionNum)) {
    return '1';
  }
  
  // インクリメントして文字列に戻す
  return String(versionNum + 1);
}

/**
 * セマンティックバージョニング形式のバージョン番号を生成する
 * @param currentVersion 現在のバージョン（x.y.z形式）
 * @param type メジャー、マイナー、パッチのどれを上げるか
 * @returns 新しいバージョン番号
 */
export function generateSemVerNumber(
  currentVersion = '0.0.0',
  type: 'major' | 'minor' | 'patch' = 'patch'
): string {
  // バージョン番号をパース
  const parts = currentVersion.split('.').map(part => parseInt(part, 10));
  
  // 無効なフォーマットの場合はデフォルト値を使用
  if (parts.length !== 3 || parts.some(isNaN)) {
    return '0.1.0';
  }
  
  const [major, minor, patch] = parts;
  
  // タイプに応じてバージョンを上げる
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

/**
 * 現在のユーザー情報を取得する（kintone環境用）
 * @returns ユーザー情報
 * @note kintone環境でない場合はダミーユーザーを返す
 */
export function getCurrentUser(): { code: string; name: string } {
  // kintone環境の場合
  if (typeof kintone !== 'undefined' && kintone.getLoginUser) {
    const user = kintone.getLoginUser();
    return {
      code: user.code || 'guest',
      name: user.name || 'ゲストユーザー',
    };
  }
  
  // kintone環境でない場合はダミーユーザーを返す
  return {
    code: 'system',
    name: 'システム',
  };
}

/**
 * 2つのJSONオブジェクトの差分を生成する（diff形式）
 * @param oldObj 以前のオブジェクト
 * @param newObj 新しいオブジェクト
 * @returns 差分情報
 */
export function generateJsonDiff(oldObj: any, newObj: any): VersionDiff[] {
  const oldJson = JSON.stringify(oldObj, null, 2);
  const newJson = JSON.stringify(newObj, null, 2);
  
  if (oldJson === newJson) {
    return [];
  }
  
  // 簡易的な差分検出
  return [
    {
      path: '',
      oldValue: oldObj,
      newValue: newObj,
      changeType: 'modified'
    }
  ];
}

/**
 * 詳細な差分を生成する（JSONPath形式）
 * @param oldObj 以前のオブジェクト
 * @param newObj 新しいオブジェクト
 * @param basePath ベースパス（再帰用）
 * @returns 差分情報
 */
export function generateDetailedJsonDiff(
  oldObj: any,
  newObj: any,
  basePath = ''
): VersionDiff[] {
  const diffs: VersionDiff[] = [];
  
  // オブジェクト型でない場合は単純比較
  if (typeof oldObj !== 'object' || typeof newObj !== 'object' || 
      oldObj === null || newObj === null) {
    if (oldObj !== newObj) {
      diffs.push({
        path: basePath,
        oldValue: oldObj,
        newValue: newObj,
        changeType: 'modified'
      });
    }
    return diffs;
  }
  
  // 配列の場合は特別な処理
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    // 単純比較のために文字列化
    const oldStr = JSON.stringify(oldObj);
    const newStr = JSON.stringify(newObj);
    
    if (oldStr !== newStr) {
      diffs.push({
        path: basePath,
        oldValue: oldObj,
        newValue: newObj,
        changeType: 'modified'
      });
    }
    return diffs;
  }
  
  // すべてのキーを取得
  const allKeys = new Set([
    ...Object.keys(oldObj),
    ...Object.keys(newObj)
  ]);
  
  // 各キーについて比較
  for (const key of allKeys) {
    const currentPath = basePath ? `${basePath}.${key}` : key;
    
    if (!(key in oldObj)) {
      // キーが追加された
      diffs.push({
        path: currentPath,
        oldValue: undefined,
        newValue: newObj[key],
        changeType: 'added'
      });
    } else if (!(key in newObj)) {
      // キーが削除された
      diffs.push({
        path: currentPath,
        oldValue: oldObj[key],
        newValue: undefined,
        changeType: 'removed'
      });
    } else {
      // 再帰的に差分を検出
      diffs.push(...generateDetailedJsonDiff(oldObj[key], newObj[key], currentPath));
    }
  }
  
  return diffs;
}

/**
 * 2つの文字列の差分を取得する（テキストベース）
 * @param oldText 以前のテキスト
 * @param newText 新しいテキスト
 * @param context コンテキスト行数
 * @returns 差分テキスト
 */
export function generateTextDiff(
  oldText: string,
  newText: string,
  context: number = 3
): string {
  const patch = diff.createPatch(
    'file',  // ダミーのファイル名
    oldText,
    newText,
    'old',   // ラベル
    'new',   // ラベル
    { context }
  );
  
  return patch;
}

/**
 * オブジェクトの深い比較を行う（deep-equalの代替）
 * @param obj1 比較対象1
 * @param obj2 比較対象2
 * @returns 等しいかどうか
 */
export function isDeepEqual(obj1: any, obj2: any): boolean {
  // 基本型の場合は単純比較
  if (obj1 === obj2) return true;
  
  // どちらかがnullまたはundefinedの場合
  if (obj1 == null || obj2 == null) return false;
  
  // 型が異なる場合
  if (typeof obj1 !== typeof obj2) return false;
  
  // オブジェクト型の場合
  if (typeof obj1 === 'object') {
    // 配列の場合
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      
      for (let i = 0; i < obj1.length; i++) {
        if (!isDeepEqual(obj1[i], obj2[i])) return false;
      }
      
      return true;
    }
    
    // 通常のオブジェクトの場合
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!isDeepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
  
  // それ以外の基本型
  return obj1 === obj2;
}
