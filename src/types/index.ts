/**
 * 型定義ファイル
 */

/**
 * アプリ情報
 */
export interface AppInfo {
  appId: string;
  name: string;
  description: string;
  spaceId?: string;
  threadId?: string;
  // 拡張情報
  creator?: {
    code: string;
    name: string;
  };
  createdAt?: string;
  modifier?: {
    code: string;
    name: string;
  };
  modifiedAt?: string;
}

/**
 * アプリフィールド情報
 */
export interface AppField {
  type: string;
  code: string;
  label: string;
  required?: boolean;
  noLabel?: boolean;
  // その他のフィールド設定
  [key: string]: any;
}

/**
 * アプリフィールド情報のマップ
 */
export interface AppFields {
  [fieldCode: string]: AppField;
}

/**
 * アプリレイアウト要素
 */
export interface LayoutElement {
  type: 'ROW' | 'SUBTABLE' | 'GROUP';
  code: string;
  fields?: LayoutField[];
  layout?: LayoutElement[];
}

/**
 * レイアウト内のフィールド
 */
export interface LayoutField {
  type: string;
  code: string;
  size?: {
    width?: string;
    height?: string;
    innerHeight?: string;
  };
}

/**
 * アプリレイアウト
 */
export interface AppLayout {
  layout: LayoutElement[];
  revision?: string;
}

/**
 * アプリビュー
 */
export interface AppView {
  name: string;
  id: string;
  type: string;
  fields: string[];
  filterCond?: string;
  sort?: string;
}

/**
 * アプリビュー一覧
 */
export interface AppViews {
  views: {
    [viewId: string]: AppView;
  };
  revision?: string;
}

/**
 * アプリカスタマイズ情報
 */
export interface AppCustomize {
  desktop?: {
    js?: Array<{
      type: string;
      url: string;
    }>;
    css?: Array<{
      type: string;
      url: string;
    }>;
  };
  mobile?: {
    js?: Array<{
      type: string;
      url: string;
    }>;
    css?: Array<{
      type: string;
      url: string;
    }>;
  };
  revision?: string;
}

/**
 * アプリアクセス権情報
 */
export interface AppAcl {
  rights: Array<{
    entity: {
      type: 'USER' | 'GROUP' | 'ORGANIZATION' | 'FIELD_ENTITY';
      code: string;
    };
    appEditable: boolean;
    recordViewable: boolean;
    recordAddable: boolean;
    recordEditable: boolean;
    recordDeletable: boolean;
    recordImportable: boolean;
    recordExportable: boolean;
  }>;
  revision?: string;
}

/**
 * アプリ設定情報
 */
export interface AppSettings {
  name?: string;
  description?: string;
  icon?: {
    type: 'FILE' | 'PRESET';
    key?: string;
    file?: {
      fileKey: string;
    };
  };
  theme?: string;
  revision?: string;
  // その他の設定情報
  [key: string]: any;
}

/**
 * アプリ詳細情報
 */
export interface AppDetail {
  appInfo: AppInfo;
  fields: AppFields;
  layout: AppLayout;
  views: AppViews;
  // 拡張情報
  customize?: AppCustomize;
  acl?: AppAcl;
  settings?: AppSettings;
}

/**
 * アプリスキーマ
 */
export interface AppSchema {
  appId: string;
  name: string;
  fields: AppFields;
  layout: AppLayout;
  views: AppViews;
  customize?: AppCustomize;
  acl?: AppAcl;
  settings?: AppSettings;
  // エクスポートメタデータ
  exportedAt: string;
  exportedBy: {
    code: string;
    name: string;
  };
}

/**
 * アプリ検索条件
 */
export interface AppSearchCriteria {
  name?: string;
  spaceIds?: string[];
  limit?: number;
  offset?: number;
  creator?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
}

/**
 * スキーマ比較結果
 */
export interface SchemaComparisonResult {
  appId1: string;
  appId2: string;
  comparedAt: string;
  differences: VersionDiff[];
  // 統計情報
  stats: {
    fieldsAdded: number;
    fieldsRemoved: number;
    fieldsModified: number;
    layoutChanges: number;
    viewChanges: number;
    settingsChanges: number;
    totalChanges: number;
  };
}

/**
 * バージョン情報
 */
export interface VersionInfo {
  versionNumber: number;  // 数値型を維持
  createdAt: string;
  createdBy: {
    code: string;
    name: string;
  };
  data: AppDetail;
  comment?: string;
}

/**
 * バージョン概要情報
 * バージョン履歴一覧表示用の軽量なバージョン情報
 */
export interface VersionSummary {
  versionNumber: number;  // 数値型を維持
  createdAt: string;
  createdBy: {
    code: string;
    name: string;
  };
  comment?: string;
  appId: string;
  appName: string;
  recordId?: string;
}

/**
 * バージョン間の差分情報
 */
export interface VersionDiff {
  path: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * バージョン比較結果
 */
export interface VersionComparisonResult {
  oldVersion: VersionInfo;
  newVersion: VersionInfo;
  diffs: VersionDiff[];
  diffStats: {
    added: number;
    removed: number;
    modified: number;
    total: number;
  };
  diffText?: string; // テキスト形式の差分表現（オプション）
  timestamp: string;
}

/**
 * バージョン作成結果
 */
export interface VersionCreationResult {
  version: VersionInfo;
  recordId: string;
  success: boolean;
  backupTimestamp: string;
}

/**
 * バージョン復元オプション
 */
export interface VersionRestoreOptions {
  // 特定セクションのみ復元する設定
  restoreFields?: boolean;
  restoreLayout?: boolean;
  restoreViews?: boolean;
  restoreCustomize?: boolean;
  restoreSettings?: boolean;
  
  // メタデータ
  restoredBy?: {
    code: string;
    name: string;
  };
  comment?: string;
}

/**
 * バージョン管理サービスのインターフェース
 */
export interface IVersionService {
  compareAppVersions(appId: number, appDetails: AppDetail): Promise<boolean>;
  createNewVersion(appId: number, appDetails: AppDetail, comment?: string): Promise<VersionInfo>;
  getLatestVersion(appId: number): Promise<VersionInfo | null>;
  getVersionHistory(appId: number, limit?: number): Promise<VersionInfo[]>;
  getVersionSummaries(appId: number, limit?: number): Promise<VersionSummary[]>;
  getVersionById(recordId: string): Promise<VersionInfo | null>;
  generateDiff(oldVersion: VersionInfo, newVersion: VersionInfo): VersionDiff[];
  compareVersions(oldVersionId: string, newVersionId: string): Promise<VersionComparisonResult>;
  restoreVersion(versionId: string, options?: VersionRestoreOptions): Promise<VersionCreationResult>;
  getVersionsByDateRange(appId: number, startDate: string, endDate: string): Promise<VersionInfo[]>;
}

/**
 * キャッシュオプション
 */
export interface CacheOptions {
  enabled: boolean;
  ttl: number; // 有効期限（ミリ秒）
}

/**
 * APIエラー情報
 */
export interface ApiError {
  code: string;
  message: string;
  errors?: any[];
  id?: string;
}

/**
 * イベントタイプ
 */
export const EVENT_TYPES = {
  INDEX_SHOW: 'app.record.index.show',
  DETAIL_SHOW: 'app.record.detail.show',
  CREATE_SHOW: 'app.record.create.show',
  EDIT_SHOW: 'app.record.edit.show',
  PRINT_SHOW: 'app.record.print.show',
  INDEX_EDIT_SHOW: 'app.record.index.edit.show'
};
