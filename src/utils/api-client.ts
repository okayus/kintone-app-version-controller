/**
 * API通信クライアント
 * kintone REST APIとの通信を行うクラス
 */
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { AppInfo, AppFields, AppLayout, AppViews, ApiError } from '../types';

/**
 * APIクライアントクラス
 */
export class ApiClient {
  private client: KintoneRestAPIClient;

  /**
   * コンストラクタ
   */
  constructor() {
    this.client = new KintoneRestAPIClient();
  }

  /**
   * アプリ一覧を取得する
   * @returns アプリ一覧
   */
  async getApps(): Promise<AppInfo[]> {
    try {
      const response = await this.client.app.getApps();
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
   * @returns フィールド情報
   */
  async getFormFields(appId: number): Promise<AppFields> {
    try {
      const response = await this.client.app.getFormFields({ app: appId });
      return response.properties;
    } catch (error) {
      this.handleError(error as ApiError, `フィールド情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのレイアウト情報を取得する
   * @param appId アプリID
   * @returns レイアウト情報
   */
  async getFormLayout(appId: number): Promise<AppLayout> {
    try {
      const response = await this.client.app.getFormLayout({ app: appId });
      return { layout: response.layout };
    } catch (error) {
      this.handleError(error as ApiError, `レイアウト情報(アプリID: ${appId})の取得中にエラーが発生しました`);
      throw error;
    }
  }

  /**
   * アプリのビュー一覧を取得する
   * @param appId アプリID
   * @returns ビュー情報
   */
  async getViews(appId: number): Promise<AppViews> {
    try {
      const response = await this.client.app.getViews({ app: appId });
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
   * @returns レコード一覧
   */
  async getRecords(appId: number, query?: string, fields?: string[]): Promise<any[]> {
    try {
      const response = await this.client.record.getRecords({
        app: appId,
        query: query || '',
        fields: fields || [],
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
   * エラーハンドリング
   * @param error エラーオブジェクト
   * @param defaultMessage デフォルトエラーメッセージ
   */
  private handleError(error: ApiError, defaultMessage: string): void {
    console.error(defaultMessage, error);
    
    // エラーの詳細情報を取得
    let errorMessage = defaultMessage;
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
    
    // ログ出力
    console.error(errorMessage);
  }
}
