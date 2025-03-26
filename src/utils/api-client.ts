/**
 * API通信クライアント
 * kintone REST APIとの通信を行うクラス
 */
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { AppInfo, AppFields, AppLayout, AppViews, ApiError } from '../types';

/**
 * API通信エラークラス
 * kintone REST API呼び出し時のエラーをカスタムエラーとして扱うためのクラス
 */
export class ApiClientError extends Error {
  public statusCode?: number;
  public errors?: any[];
  public id?: string;

  constructor(message: string, statusCode?: number, errors?: any[], id?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.id = id;
  }
}

/**
 * API通信クライアントインターフェース
 * API通信に必要なメソッドを定義
 */
export interface IApiClient {
  getApps(): Promise<AppInfo[]>;
  getApp(appId: number): Promise<AppInfo>;
  getFormFields(appId: number): Promise<AppFields>;
  getFormLayout(appId: number): Promise<AppLayout>;
  getViews(appId: number): Promise<AppViews>;
  getRecords(appId: number, query?: string, fields?: string[]): Promise<any[]>;
  postRecord(appId: number, record: Record<string, any>): Promise<{ id: string; revision: string }>;
  putRecord(
    appId: number,
    recordId: number,
    record: Record<string, any>,
    revision?: string
  ): Promise<{ revision: string }>;
}

/**
 * APIクライアントクラス
 */
export class ApiClient implements IApiClient {
  private client: KintoneRestAPIClient;

  /**
   * コンストラクタ
   * @param clientOrBaseUrl KintoneRestAPIClientインスタンスまたはベースURL
   */
  constructor(clientOrBaseUrl?: KintoneRestAPIClient | string) {
    if (clientOrBaseUrl instanceof KintoneRestAPIClient) {
      // テスト用：既存のクライアントインスタンスを使用
      this.client = clientOrBaseUrl;
    } else {
      // 新規クライアント作成
      const baseUrl = typeof clientOrBaseUrl === 'string' ? clientOrBaseUrl : undefined;
      const options: any = baseUrl ? { baseUrl } : {};
      
      // Node.js環境（テスト時）には認証情報が必要
      if (typeof window === 'undefined') {
        options.auth = {
          apiToken: process.env.KINTONE_API_TOKEN || 'DUMMY_API_TOKEN_FOR_TESTING'
        };
      }
      
      this.client = new KintoneRestAPIClient(options);
    }
  }

  /**
   * アプリ一覧を取得する
   * @param offset オフセット（ページネーション用）
   * @param limit 取得件数（ページネーション用）
   * @returns アプリ一覧
   */
  async getApps(offset?: number, limit?: number): Promise<AppInfo[]> {
    try {
      const response = await this.client.app.getApps({
        offset: offset || 0,
        limit: limit || 100
      });
      return response.apps.map(app => ({
        appId: app.appId,
        name: app.name,
        description: app.description || '',
        spaceId: app.spaceId,
        threadId: app.threadId,
      }));
    } catch (error) {
      this.handleError(error as ApiError, 'アプリ一覧の取得中にエラーが発生しました');
      throw error;
    }
  }

  /**
   * アプリの詳細情報を取得する
   * @param appId アプリID
   * @returns アプリ情報
   */
  async getApp(appId: number): Promise<AppInfo> {
    try {
      const response = await this.client.app.getApp({ id: appId });
      return {
        appId: response.appId,
        name: response.name,
        description: response.description || '',
        spaceId: response.spaceId,
        threadId: response.threadId,
      };
    } catch (error) {
      this.handleError(error as ApiError, `アプリ情報(ID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのフィールド情報を取得する
   * @param appId アプリID
   * @param lang 言語（オプション）
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns フィールド情報
   */
  async getFormFields(appId: number, lang?: string, preview?: boolean): Promise<AppFields> {
    try {
      const params: any = { app: appId };
      if (lang) params.lang = lang;
      if (preview) params.preview = preview;

      const response = await this.client.app.getFormFields(params);
      return response.properties;
    } catch (error) {
      this.handleError(error as ApiError, `フィールド情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのレイアウト情報を取得する
   * @param appId アプリID
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns レイアウト情報
   */
  async getFormLayout(appId: number, preview?: boolean): Promise<AppLayout> {
    try {
      const params: any = { app: appId };
      if (preview) params.preview = true;

      const response = await this.client.app.getFormLayout(params);
      return { layout: response.layout };
    } catch (error) {
      this.handleError(error as ApiError, `レイアウト情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのビュー一覧を取得する
   * @param appId アプリID
   * @param lang 言語（オプション）
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns ビュー情報
   */
  async getViews(appId: number, lang?: string, preview?: boolean): Promise<AppViews> {
    try {
      const params: any = { app: appId };
      if (lang) params.lang = lang;
      if (preview) params.preview = preview;

      const response = await this.client.app.getViews(params);
      return { views: response.views };
    } catch (error) {
      this.handleError(error as ApiError, `ビュー情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのレコードを取得する
   * @param appId アプリID
   * @param query 検索クエリ
   * @param fields 取得するフィールド
   * @param totalCount 総レコード数を取得するかどうか
   * @returns レコード一覧
   */
  async getRecords(
    appId: number, 
    query?: string, 
    fields?: string[],
    totalCount?: boolean
  ): Promise<any[]> {
    try {
      const response = await this.client.record.getRecords({
        app: appId,
        query: query || '',
        fields: fields || [],
        totalCount: totalCount || false
      });
      return response.records;
    } catch (error) {
      this.handleError(error as ApiError, `レコード(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * レコードを登録する
   * @param appId アプリID
   * @param record レコードデータ
   * @returns 登録結果
   */
  async postRecord(appId: number, record: Record<string, any>): Promise<{ id: string; revision: string }> {
    try {
      const response = await this.client.record.addRecord({
        app: appId,
        record,
      });
      return {
        id: response.id,
        revision: response.revision,
      };
    } catch (error) {
      this.handleError(error as ApiError, `レコード登録(アプリID: ${appId})中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * レコードを更新する
   * @param appId アプリID
   * @param recordId number レコードID
   * @param record 更新データ
   * @param revision リビジョン
   * @returns 更新結果
   */
  async putRecord(
    appId: number,
    recordId: number,
    record: Record<string, any>,
    revision?: string
  ): Promise<{ revision: string }> {
    try {
      const response = await this.client.record.updateRecord({
        app: appId,
        id: recordId,
        record,
        revision: revision || undefined,
      });
      return {
        revision: response.revision,
      };
    } catch (error) {
      this.handleError(error as ApiError, `レコード更新(アプリID: ${appId}, レコードID: ${recordId})中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * 複数レコードを一括登録する
   * @param appId アプリID
   * @param records レコードの配列
   * @returns 登録結果
   */
  async postRecords(appId: number, records: Record<string, any>[]): Promise<{ ids: string[]; revisions: string[] }> {
    try {
      const response = await this.client.record.addRecords({
        app: appId,
        records: records,
      });
      return {
        ids: response.ids,
        revisions: response.revisions,
      };
    } catch (error) {
      this.handleError(error as ApiError, `レコード一括登録(アプリID: ${appId})中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * 複数レコードを一括更新する
   * @param appId アプリID
   * @param records 更新するレコードの配列
   * @returns 更新結果
   */
  async putRecords(
    appId: number, 
    records: Array<{
      id: number;
      record: Record<string, any>;
      revision?: string;
    }>
  ): Promise<{ records: Array<{ id: string; revision: string }> }> {
    try {
      const response = await this.client.record.updateRecords({
        app: appId,
        records: records,
      });
      return {
        records: response.records,
      };
    } catch (error) {
      this.handleError(error as ApiError, `レコード一括更新(アプリID: ${appId})中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのカスタマイズ情報を取得する
   * @param appId アプリID
   * @param preview プレビュー版を取得するかどうか（オプション）
   * @returns カスタマイズ情報
   */
  async getAppCustomize(appId: number, preview?: boolean): Promise<any> {
    try {
      const params: any = { app: appId };
      if (preview) params.preview = true;

      const response = await this.client.app.getAppCustomize(params);
      return response;
    } catch (error) {
      this.handleError(error as ApiError, `アプリカスタマイズ情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * エラーハンドリング
   * @param error エラーオブジェクト
   * @param defaultMessage デフォルトエラーメッセージ
   * @throws {ApiClientError} フォーマットされたエラー情報
   */
  private handleError(error: ApiError, defaultMessage: string): void {
    console.error(defaultMessage, error);
    
    // エラーの詳細情報を取得
    let errorMessage = defaultMessage;
    let statusCode: number | undefined;
    
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    // 詳細なエラー情報がある場合は追加
    if (error.errors && error.errors.length > 0) {
      const details = error.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join(', ');
      errorMessage += ` (${details})`;
    }
    
    // エラーコードから推測されるHTTPステータスコード
    if (error.code) {
      if (error.code === 'GAIA_NO_PERMISSION') {
        statusCode = 403;
      } else if (error.code === 'GAIA_APP_NOT_FOUND') {
        statusCode = 404;
      } else if (error.code.startsWith('GAIA_')) {
        statusCode = 400;
      }
    }
    
    // カスタムエラーオブジェクトを作成
    const clientError = new ApiClientError(
      errorMessage, 
      statusCode, 
      error.errors, 
      error.id
    );
    
    // エラーをスロー
    throw clientError;
  }
}
