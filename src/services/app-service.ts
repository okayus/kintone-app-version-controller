/**
 * アプリ情報取得サービス
 * kintoneアプリの情報を取得するためのサービスクラス
 */
import { ApiClient } from '../utils/api-client';
import { AppInfo, AppDetail } from '../types';
import { sleep } from '../utils/helpers';

/**
 * アプリ情報取得サービスクラス
 */
export class AppService {
  private apiClient: ApiClient;
  
  /**
   * コンストラクタ
   */
  constructor() {
    this.apiClient = new ApiClient();
  }
  
  /**
   * すべてのアプリ情報を取得する
   * @returns アプリ一覧
   */
  async getAllApps(): Promise<AppInfo[]> {
    return await this.apiClient.getApps();
  }
  
  /**
   * 指定したアプリの詳細情報を取得する
   * @param appId アプリID
   * @returns アプリ詳細情報
   */
  async getAppDetails(appId: number): Promise<AppDetail> {
    try {
      // APIリクエストの連続実行を避けるため少し待機
      await sleep(100);
      
      // 並列で各情報を取得
      const [appInfo, fields, layout, views] = await Promise.all([
        this.apiClient.getApp(appId),
        this.apiClient.getFormFields(appId),
        this.apiClient.getFormLayout(appId),
        this.apiClient.getViews(appId),
      ]);
      
      // 結果を統合
      return {
        appInfo,
        fields,
        layout,
        views,
      };
    } catch (error) {
      console.error(`アプリ詳細情報(ID: ${appId})の取得中にエラーが発生しました`, error);
      throw error;
    }
  }
  
  /**
   * アプリのフォームフィールド情報を取得する
   * @param appId アプリID
   * @returns フォームフィールド情報
   */
  async getAppFormFields(appId: number) {
    return await this.apiClient.getFormFields(appId);
  }
  
  /**
   * アプリのフォームレイアウト情報を取得する
   * @param appId アプリID
   * @returns フォームレイアウト情報
   */
  async getAppFormLayout(appId: number) {
    return await this.apiClient.getFormLayout(appId);
  }
  
  /**
   * アプリのビュー情報を取得する
   * @param appId アプリID
   * @returns ビュー情報
   */
  async getAppViews(appId: number) {
    return await this.apiClient.getViews(appId);
  }
}
