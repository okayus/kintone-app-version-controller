/**
 * kintone型定義支援ユーティリティ
 * アプリIDに対応した型定義を利用するためのヘルパー関数
 */

import { normalizeRecord } from './helpers';

/**
 * バージョン管理システム（アプリID: 374）のレコード型
 * @param record kintoneレコード
 * @returns 型付きの正規化されたレコード
 */
export function normalizeVersionControlRecord(record: any): kintone.types.SavedFields {
  return normalizeRecord(record) as unknown as kintone.types.SavedFields;
}

/**
 * アプリ一覧（アプリID: 382）のレコード型
 * @param record kintoneレコード
 * @returns 型付きの正規化されたレコード
 */
export function normalizeAppListRecord(record: any): kintone.types.SavedFields {
  return normalizeRecord(record) as unknown as kintone.types.SavedFields;
}

/**
 * バージョン管理システム（アプリID: 374）のフィールド値にアクセスするためのヘルパー
 * 指定されたレコードとフィールド名からkintone型定義を使って正しい型情報を持つ値を取得する
 * @param record 正規化されたレコード
 * @param fieldCode フィールドコード
 * @returns フィールド値
 */
export function getVersionControlFieldValue<K extends keyof kintone.types.Fields>(
  record: kintone.types.SavedFields,
  fieldCode: K
): ReturnType<kintone.types.Fields[K]['value']> {
  return record[fieldCode] as ReturnType<kintone.types.Fields[K]['value']>;
}

/**
 * アプリ一覧（アプリID: 382）のフィールド値にアクセスするためのヘルパー
 * 指定されたレコードとフィールド名からkintone型定義を使って正しい型情報を持つ値を取得する
 * @param record 正規化されたレコード
 * @param fieldCode フィールドコード
 * @returns フィールド値
 */
export function getAppListFieldValue<K extends keyof kintone.types.Fields>(
  record: kintone.types.SavedFields,
  fieldCode: K
): ReturnType<kintone.types.Fields[K]['value']> {
  return record[fieldCode] as ReturnType<kintone.types.Fields[K]['value']>;
}

/**
 * バージョン管理システムのレコードをバージョン情報として正規化する
 * @param record kintoneレコード
 * @param includeData データフィールドをパースするかどうか
 * @returns 正規化されたバージョン情報
 */
export function normalizeVersionRecord(record: any, includeData = true): {
  versionNumber: number;
  appId: string;
  appName: string;
  createdAt: string;
  createdBy: { code: string; name: string };
  comment: string;
  data?: any;
  recordId?: string;
} {
  const normalizedRecord = normalizeVersionControlRecord(record);
  const result = {
    versionNumber: Number(normalizedRecord.version),
    appId: normalizedRecord.appId,
    appName: normalizedRecord.app_name,
    createdAt: normalizedRecord.作成日時,
    createdBy: {
      code: normalizedRecord.作成者.code,
      name: normalizedRecord.作成者.name || '',
    },
    comment: normalizedRecord.データ種別,
    recordId: record.$id?.value,
  };

  // データフィールドの解析（重いので必要な場合のみ）
  if (includeData && normalizedRecord.getAppResponse) {
    try {
      result.data = JSON.parse(normalizedRecord.getAppResponse);
    } catch (e) {
      console.error('Failed to parse version data', e);
    }
  }

  return result;
}

/**
 * アプリ一覧のレコードをアプリ情報として正規化する
 * @param record kintoneレコード
 * @returns 正規化されたアプリ情報
 */
export function normalizeAppListRecord2(record: any): {
  appId: string;
  appName: string;
  appType: string;
  description: string;
  spaceId?: string;
  threadId?: string;
  creator?: { code: string; name: string };
  createdAt?: string;
  recordId?: string;
} {
  const normalizedRecord = normalizeAppListRecord(record);
  return {
    appId: normalizedRecord.appId,
    appName: normalizedRecord.name,
    appType: normalizedRecord.appType,
    description: normalizedRecord.description,
    spaceId: normalizedRecord.spaceId?.toString(),
    threadId: normalizedRecord.threadId?.toString(),
    creator: {
      code: normalizedRecord.作成者.code,
      name: normalizedRecord.作成者.name || '',
    },
    createdAt: normalizedRecord.作成日時,
    recordId: record.$id?.value,
  };
}
