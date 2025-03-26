/**
 * API通信クライアント
 * kintone REST APIとの通信を行うクラス
 */
import { KintoneRestAPIClient } from '@kintone/rest-api-client';

export class ApiClient {
  private client: KintoneRestAPIClient;

  constructor() {
    this.client = new KintoneRestAPIClient();
  }

  /**
   * アプリ一覧を取得する
   * @returns アプリ一覧
   */
  async getApps(): Promise<any[]> {
    try {
      const response = await this.client.app.getApps();
      return response.apps;
    } catch (error) {
      console.error('Error fetching apps:', error);
      throw error;
    }
  }

  /**
   * アプリの詳細情報を取得する
   * @param appId アプリID
   * @returns アプリ情報
   */
  async getApp(appId: number): Promise<any> {
    try {
      const response = await this.client.app.getApp({ id: appId });
      return response;
    } catch (error) {
      console.error(`Error fetching app ${appId}:`, error);
      throw error;
    }
  }

  // 今後実装予定のメソッド
  // async getFormFields(appId: number): Promise<any>
  // async getFormLayout(appId: number): Promise<any>
  // async getViews(appId: number): Promise<any>
  // async getRecords(appId: number, query?: string): Promise<any[]>
  // async postRecord(appId: number, record: Record<string, any>): Promise<any>
  // async putRecord(appId: number, recordId: number, record: Record<string, any>): Promise<any>
}