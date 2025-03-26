/**
 * アプリ情報取得サービス
 * kintoneアプリの情報を取得するためのサービスクラス
 */
import { ApiClient, ApiClientError } from '../utils/api-client';
import { 
  AppInfo, 
  AppDetail, 
  AppFields, 
  AppLayout, 
  AppViews, 
  AppCustomize, 
  AppAcl, 
  AppSettings, 
  AppSearchCriteria, 
  AppSchema,
  SchemaComparisonResult,
  VersionDiff
} from '../types';
import { sleep } from '../utils/helpers';
import { MemoryCache } from '../utils/cache';
import deepEqual from 'deep-equal';

/**
 * アプリ情報取得サービスインターフェース
 */
export interface IAppService {
  getAllApps(offset?: number, limit?: number): Promise<AppInfo[]>;
  searchApps(criteria: AppSearchCriteria): Promise<AppInfo[]>;
  getAppDetails(appId: number): Promise<AppDetail>;
  getAppFormFields(appId: number, lang?: string, preview?: boolean): Promise<AppFields>;
  getAppFormLayout(appId: number, preview?: boolean): Promise<AppLayout>;
  getAppViews(appId: number, lang?: string, preview?: boolean): Promise<AppViews>;
  getAppCustomize(appId: number, preview?: boolean): Promise<AppCustomize>;
  getAppAcl(appId: number): Promise<AppAcl>;
  getAppSettings(appId: number): Promise<AppSettings>;
  exportAppSchema(appId: number): Promise<AppSchema>;
  compareAppSchemas(schema1: AppSchema, schema2: AppSchema): SchemaComparisonResult;
  clearCache(): void;
  setCacheEnabled(enabled: boolean): void;
}

/**
 * アプリ情報取得サービスクラス
 */
export class AppService implements IAppService {
  private apiClient: ApiClient;
  private cache: MemoryCache<any>;
  
  /**
   * コンストラクタ
   * @param apiClientOrBaseUrl ApiClientインスタンスまたはベースURL
   * @param cacheEnabled キャッシュを有効にするかどうか
   */
  constructor(apiClientOrBaseUrl?: ApiClient | string, cacheEnabled: boolean = true) {
    if (apiClientOrBaseUrl instanceof ApiClient) {
      // テスト用：既存のAPIクライアントを使用
      this.apiClient = apiClientOrBaseUrl;
    } else {
      // 新規APIクライアント作成
      this.apiClient = new ApiClient(apiClientOrBaseUrl);
    }
    
    // キャッシュを初期化
    this.cache = new MemoryCache({ enabled: cacheEnabled });
  }
  
  /**
   * すべてのアプリ情報を取得する
   * @param offset オフセット（ページネーション用）
   * @param limit 取得件数（ページネーション用）
   * @returns アプリ一覧
   */
  async getAllApps(offset: number = 0, limit: number = 100): Promise<AppInfo[]> {
    const cacheKey = `getAllApps_${offset}_${limit}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const apps = await this.apiClient.getApps(offset, limit);
    this.cache.set(cacheKey, apps);
    return apps;
  }
  
  /**
   * 条件に基づいてアプリを検索する
   * @param criteria 検索条件
   * @returns 検索結果
   */
  async searchApps(criteria: AppSearchCriteria): Promise<AppInfo[]> {
    // オプションのデフォルト値
    const { 
      name, 
      spaceIds,
      limit = 100, 
      offset = 0, 
      creator,
      modifiedAfter,
      modifiedBefore
    } = criteria;
    
    // 検索条件のハッシュをキャッシュキーとして使用
    const cacheKey = `searchApps_${JSON.stringify(criteria)}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // すべてのアプリを取得
      const allApps = await this.getAllApps(offset, limit);
      
      // クライアント側でフィルタリング
      let filteredApps = allApps;
      
      // 名前でフィルタリング
      if (name) {
        filteredApps = filteredApps.filter(app => 
          app.name.toLowerCase().includes(name.toLowerCase()) ||
          (app.description && app.description.toLowerCase().includes(name.toLowerCase()))
        );
      }
      
      // スペースIDでフィルタリング
      if (spaceIds && spaceIds.length > 0) {
        filteredApps = filteredApps.filter(app => 
          app.spaceId && spaceIds.includes(app.spaceId)
        );
      }
      
      // 作成者でフィルタリング（詳細情報が必要な場合は追加取得）
      if (creator || modifiedAfter || modifiedBefore) {
        // 詳細情報が必要なアプリのみ取得
        const appsWithDetails = await Promise.all(
          filteredApps.map(async app => {
            try {
              return await this.getApp(parseInt(app.appId));
            } catch (error) {
              console.warn(`アプリ詳細情報の取得に失敗: ${app.appId}`, error);
              return app;
            }
          })
        );
        
        filteredApps = appsWithDetails.filter(app => {
          let match = true;
          
          // 作成者でフィルタリング
          if (creator && app.creator) {
            match = match && (
              app.creator.code === creator || 
              (app.creator.name && app.creator.name.includes(creator))
            );
          }
          
          // 更新日時でフィルタリング
          if (modifiedAfter && app.modifiedAt) {
            match = match && new Date(app.modifiedAt) >= new Date(modifiedAfter);
          }
          
          if (modifiedBefore && app.modifiedAt) {
            match = match && new Date(app.modifiedAt) <= new Date(modifiedBefore);
          }
          
          return match;
        });
      }
      
      this.cache.set(cacheKey, filteredApps);
      return filteredApps;
    } catch (error) {
      console.error('アプリ検索中にエラーが発生しました', error);
      throw error;
    }
  }
  
  /**
   * 指定したアプリの詳細情報を取得する
   * @param appId アプリID
   * @returns アプリ詳細情報
   */
  async getAppDetails(appId: number): Promise<AppDetail> {
    try {
      const cacheKey = `appDetails_${appId}`;
      const cachedResult = this.cache.get(cacheKey);
      
      if (cachedResult) {
        return cachedResult;
      }
      
      // APIリクエストの連続実行を避けるため少し待機
      await sleep(100);
      
      // 並列で各情報を取得
      const [appInfo, fields, layout, views, customize, acl, settings] = await Promise.all([
        this.getApp(appId),
        this.getAppFormFields(appId),
        this.getAppFormLayout(appId),
        this.getAppViews(appId),
        this.getAppCustomize(appId).catch(e => undefined),
        this.getAppAcl(appId).catch(e => undefined),
        this.getAppSettings(appId).catch(e => undefined),
      ]);
      
      // 結果を統合
      const appDetail: AppDetail = {
        appInfo,
        fields,
        layout,
        views,
      };
      
      // オプションのデータがある場合は追加
      if (customize) appDetail.customize = customize;
      if (acl) appDetail.acl = acl;
      if (settings) appDetail.settings = settings;
      
      this.cache.set(cacheKey, appDetail);
      return appDetail;
    } catch (error) {
      console.error(`アプリ詳細情報(ID: ${appId})の取得中にエラーが発生しました`, error);
      throw error;
    }
  }
  
  /**
   * アプリ情報を取得する
   * @param appId アプリID
   * @returns アプリ情報
   */
  async getApp(appId: number): Promise<AppInfo> {
    const cacheKey = `app_${appId}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const appInfo = await this.apiClient.getApp(appId);
    this.cache.set(cacheKey, appInfo);
    return appInfo;
  }
  
  /**
   * アプリのフォームフィールド情報を取得する
   * @param appId アプリID
   * @param lang 言語（オプション）
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns フォームフィールド情報
   */
  async getAppFormFields(appId: number, lang?: string, preview?: boolean): Promise<AppFields> {
    const cacheKey = `formFields_${appId}_${lang || 'default'}_${preview ? 'preview' : 'live'}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const fields = await this.apiClient.getFormFields(appId, lang, preview);
    this.cache.set(cacheKey, fields);
    return fields;
  }
  
  /**
   * アプリのフォームレイアウト情報を取得する
   * @param appId アプリID
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns フォームレイアウト情報
   */
  async getAppFormLayout(appId: number, preview?: boolean): Promise<AppLayout> {
    const cacheKey = `formLayout_${appId}_${preview ? 'preview' : 'live'}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const layout = await this.apiClient.getFormLayout(appId, preview);
    this.cache.set(cacheKey, layout);
    return layout;
  }
  
  /**
   * アプリのビュー情報を取得する
   * @param appId アプリID
   * @param lang 言語（オプション）
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns ビュー情報
   */
  async getAppViews(appId: number, lang?: string, preview?: boolean): Promise<AppViews> {
    const cacheKey = `views_${appId}_${lang || 'default'}_${preview ? 'preview' : 'live'}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const views = await this.apiClient.getViews(appId, lang, preview);
    this.cache.set(cacheKey, views);
    return views;
  }
  
  /**
   * アプリのカスタマイズ情報（JS/CSSカスタマイズ）を取得する
   * @param appId アプリID
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns カスタマイズ情報
   */
  async getAppCustomize(appId: number, preview?: boolean): Promise<AppCustomize> {
    const cacheKey = `customize_${appId}_${preview ? 'preview' : 'live'}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const customize = await this.apiClient.getAppCustomize(appId, preview);
    this.cache.set(cacheKey, customize);
    return customize;
  }
  
  /**
   * アプリのアクセス権情報を取得する
   * @param appId アプリID
   * @returns アクセス権情報
   */
  async getAppAcl(appId: number): Promise<AppAcl> {
    // この関数はモックや追加実装が必要
    // 現在のAPI通信クライアントにはアクセス権取得のメソッドがないため例外をスロー
    throw new ApiClientError('アクセス権情報取得機能は未実装です', 501);
  }
  
  /**
   * アプリの一般設定情報を取得する
   * @param appId アプリID
   * @returns 一般設定情報
   */
  async getAppSettings(appId: number): Promise<AppSettings> {
    // この関数はモックや追加実装が必要
    // 現在のAPI通信クライアントには一般設定取得のメソッドがないため例外をスロー
    throw new ApiClientError('アプリ設定情報取得機能は未実装です', 501);
  }
  
  /**
   * アプリスキーマをエクスポートする
   * @param appId アプリID
   * @returns アプリスキーマ
   */
  async exportAppSchema(appId: number): Promise<AppSchema> {
    try {
      // アプリ詳細情報を取得
      const appDetail = await this.getAppDetails(appId);
      
      // アプリスキーマを構築
      const schema: AppSchema = {
        appId: appDetail.appInfo.appId,
        name: appDetail.appInfo.name,
        fields: appDetail.fields,
        layout: appDetail.layout,
        views: appDetail.views,
        // 取得できる場合は追加設定も含める
        customize: appDetail.customize,
        acl: appDetail.acl,
        settings: appDetail.settings,
        // エクスポートメタデータ
        exportedAt: new Date().toISOString(),
        exportedBy: {
          code: 'SYSTEM',
          name: 'App Version Controller',
        },
      };
      
      return schema;
    } catch (error) {
      console.error(`アプリスキーマのエクスポート中にエラーが発生しました(ID: ${appId})`, error);
      throw error;
    }
  }
  
  /**
   * 2つのアプリスキーマを比較する
   * @param schema1 比較元のスキーマ
   * @param schema2 比較先のスキーマ
   * @returns 比較結果
   */
  compareAppSchemas(schema1: AppSchema, schema2: AppSchema): SchemaComparisonResult {
    const differences: VersionDiff[] = [];
    
    // フィールドの比較
    const allFieldCodes = new Set([
      ...Object.keys(schema1.fields || {}),
      ...Object.keys(schema2.fields || {})
    ]);
    
    let fieldsAdded = 0;
    let fieldsRemoved = 0;
    let fieldsModified = 0;
    
    allFieldCodes.forEach(fieldCode => {
      const field1 = schema1.fields?.[fieldCode];
      const field2 = schema2.fields?.[fieldCode];
      
      if (!field1) {
        // フィールドが追加された
        differences.push({
          path: `fields.${fieldCode}`,
          oldValue: null,
          newValue: field2,
          changeType: 'added'
        });
        fieldsAdded++;
      } else if (!field2) {
        // フィールドが削除された
        differences.push({
          path: `fields.${fieldCode}`,
          oldValue: field1,
          newValue: null,
          changeType: 'removed'
        });
        fieldsRemoved++;
      } else if (!deepEqual(field1, field2)) {
        // フィールドが変更された
        differences.push({
          path: `fields.${fieldCode}`,
          oldValue: field1,
          newValue: field2,
          changeType: 'modified'
        });
        fieldsModified++;
      }
    });
    
    // レイアウトの比較（簡易比較）
    const layoutChanged = !deepEqual(schema1.layout, schema2.layout);
    const layoutChanges = layoutChanged ? 1 : 0;
    
    if (layoutChanged) {
      differences.push({
        path: 'layout',
        oldValue: schema1.layout,
        newValue: schema2.layout,
        changeType: 'modified'
      });
    }
    
    // ビューの比較
    const allViewIds = new Set([
      ...Object.keys(schema1.views?.views || {}),
      ...Object.keys(schema2.views?.views || {})
    ]);
    
    let viewChanges = 0;
    
    allViewIds.forEach(viewId => {
      const view1 = schema1.views?.views?.[viewId];
      const view2 = schema2.views?.views?.[viewId];
      
      if (!view1) {
        // ビューが追加された
        differences.push({
          path: `views.${viewId}`,
          oldValue: null,
          newValue: view2,
          changeType: 'added'
        });
        viewChanges++;
      } else if (!view2) {
        // ビューが削除された
        differences.push({
          path: `views.${viewId}`,
          oldValue: view1,
          newValue: null,
          changeType: 'removed'
        });
        viewChanges++;
      } else if (!deepEqual(view1, view2)) {
        // ビューが変更された
        differences.push({
          path: `views.${viewId}`,
          oldValue: view1,
          newValue: view2,
          changeType: 'modified'
        });
        viewChanges++;
      }
    });
    
    // カスタマイズの比較（簡易比較）
    const customizeChanged = !deepEqual(schema1.customize, schema2.customize);
    const settingsChanged = !deepEqual(schema1.settings, schema2.settings);
    const aclChanged = !deepEqual(schema1.acl, schema2.acl);
    
    const settingsChanges = (customizeChanged ? 1 : 0) + 
                           (settingsChanged ? 1 : 0) + 
                           (aclChanged ? 1 : 0);
    
    if (customizeChanged) {
      differences.push({
        path: 'customize',
        oldValue: schema1.customize,
        newValue: schema2.customize,
        changeType: 'modified'
      });
    }
    
    if (settingsChanged) {
      differences.push({
        path: 'settings',
        oldValue: schema1.settings,
        newValue: schema2.settings,
        changeType: 'modified'
      });
    }
    
    if (aclChanged) {
      differences.push({
        path: 'acl',
        oldValue: schema1.acl,
        newValue: schema2.acl,
        changeType: 'modified'
      });
    }
    
    return {
      appId1: schema1.appId,
      appId2: schema2.appId,
      comparedAt: new Date().toISOString(),
      differences,
      stats: {
        fieldsAdded,
        fieldsRemoved,
        fieldsModified,
        layoutChanges,
        viewChanges,
        settingsChanges,
        totalChanges: differences.length
      }
    };
  }
  
  /**
   * キャッシュをクリアする
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * キャッシュの有効/無効を設定する
   * @param enabled 有効にする場合はtrue
   */
  setCacheEnabled(enabled: boolean): void {
    this.cache.setEnabled(enabled);
  }
}
