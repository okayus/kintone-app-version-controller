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
  versionNumber: string;
  createdAt: string;
  createdBy: {
    code: string;
    name: string;
  };
  data: AppDetail;
  comment?: string;
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
