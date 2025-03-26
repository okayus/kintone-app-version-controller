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
}

/**
 * アプリ詳細情報
 */
export interface AppDetail {
  appInfo: AppInfo;
  fields: AppFields;
  layout: AppLayout;
  views: AppViews;
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
 * APIエラー情報
 */
export interface ApiError {
  code: string;
  message: string;
  errors?: any[];
  id?: string;
}
