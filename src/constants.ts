/**
 * 定数定義ファイル
 */

/**
 * アプリIDの定義
 */
export const APP_IDS = {
  // バージョン管理用アプリのID
  APP_VERSION_CONTROL: 374,
  // 設定アプリのID
  CONFIG_APP: 375,
};

/**
 * バージョン管理用アプリのフィールドコード
 */
export const VERSION_FIELD_CODES = {
  // アプリID（数値）
  APP_ID: 'appId',
  // アプリ名（文字列）
  APP_NAME: 'appName',
  // バージョン番号（文字列）
  VERSION_NUMBER: 'versionNumber',
  // 作成日時（日時）
  CREATED_AT: 'createdAt',
  // 作成者（ユーザー選択）
  CREATED_BY: 'createdBy',
  // アプリデータ（JSON文字列）
  DATA: 'data',
  // コメント（文字列複数行）
  COMMENT: 'comment',
};

/**
 * 設定アプリのフィールドコード
 */
export const CONFIG_FIELD_CODES = {
  // 設定ID（文字列）
  CONFIG_ID: 'configId',
  // 設定値（JSON文字列）
  CONFIG_VALUE: 'configValue',
  // 説明（文字列複数行）
  DESCRIPTION: 'description',
  // 最終更新日時（日時）
  UPDATED_AT: 'updatedAt',
  // 最終更新者（ユーザー選択）
  UPDATED_BY: 'updatedBy',
};

/**
 * 設定アプリの設定ID
 */
export const CONFIG_IDS = {
  // 監視対象アプリリスト
  WATCHED_APPS: 'watched_apps',
  // バージョン管理設定
  VERSION_CONTROL_SETTINGS: 'version_control_settings',
  // 通知設定
  NOTIFICATION_SETTINGS: 'notification_settings',
};

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS = {
  // バージョン管理の設定デフォルト値
  VERSION_CONTROL: {
    // 自動バージョン作成を有効にするかどうか
    autoVersioning: true,
    // 最大保持バージョン数（0＝無制限）
    maxVersions: 100,
    // バージョン作成前の確認ダイアログを表示するかどうか
    showConfirmation: true,
    // バージョン番号の形式（simple=連番、semver=セマンティックバージョニング）
    versionFormat: 'simple',
  },
  // 通知設定のデフォルト値
  NOTIFICATION: {
    // 通知を有効にするかどうか
    enabled: false,
    // 通知方法（ブラウザ通知、メール、Slack、Teams等）
    methods: ['browser'],
    // 通知するイベント
    events: ['version_created', 'version_restored'],
  },
};
