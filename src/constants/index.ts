/**
 * 定数定義
 */

/**
 * アプリID
 */
export const APP_IDS = {
  /** アプリ一覧 */
  APP_LIST: 382,
  /** アプリバージョン管理システム */
  APP_VERSION_CONTROL: 374,
  /** 業務フロー図 */
  BUSINESS_FLOW: 375,
  /** データフロー図 */
  DATA_FLOW: 376,
  /** ハブ */
  HUB: 383,
};

/**
 * アプリバージョン管理システムのフィールドコード
 */
export const VERSION_FIELD_CODES = {
  /** アプリID */
  APP_ID: 'appId',
  /** アプリ名 */
  APP_NAME: 'appName',
  /** バージョン番号 */
  VERSION_NUMBER: 'versionNumber',
  /** 作成日時 */
  CREATED_AT: 'createdAt',
  /** 作成者 */
  CREATED_BY: 'createdBy',
  /** データ（JSON形式） */
  DATA: 'data',
  /** コメント */
  COMMENT: 'comment',
};

/**
 * アプリ一覧のフィールドコード
 */
export const APP_LIST_FIELD_CODES = {
  /** アプリID */
  APP_ID: 'appId',
  /** アプリ名 */
  APP_NAME: 'appName',
  /** 説明 */
  DESCRIPTION: 'description',
  /** スペースID */
  SPACE_ID: 'spaceId',
  /** スレッドID */
  THREAD_ID: 'threadId',
  /** 最新バージョン情報 */
  LATEST_VERSION: 'latestVersion',
  /** 最新バックアップ日時 */
  LATEST_BACKUP_DATE: 'latestBackupDate',
};

/**
 * イベントタイプ
 */
export const EVENT_TYPES = {
  /** インデックス表示 */
  INDEX_SHOW: 'app.record.index.show',
  /** 詳細表示 */
  DETAIL_SHOW: 'app.record.detail.show',
  /** 作成表示 */
  CREATE_SHOW: 'app.record.create.show',
  /** 編集表示 */
  EDIT_SHOW: 'app.record.edit.show',
  /** 保存成功 */
  CREATE_SUCCESS: 'app.record.create.submit.success',
  /** 更新成功 */
  UPDATE_SUCCESS: 'app.record.edit.submit.success',
};

/**
 * カスタマイズJSのID
 */
export const CUSTOMIZE_IDS = {
  /** バックアップボタン */
  BACKUP_BUTTON: 'backup-button',
  /** 進捗表示 */
  PROGRESS_INDICATOR: 'progress-indicator',
};
