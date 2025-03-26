/**
 * アプリ情報取得サービス
 * kintoneアプリの情報を取得するためのサービスクラス
 */
import { ApiClient } from '../utils/api-client';

export class AppService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * すべてのアプリ情報を取得する
   * @returns アプリ一覧
   */
  async getAllApps() {
    // TODO: 実装
    return [];
  }

  /**
   * 指定したアプリの詳細情報を取得する
   * @param appId アプリID
   * @returns アプリ詳細情報
   */
  async getAppDetails(appId: number) {
    // TODO: 実装
    return {};
  }

  // 今後実装予定のメソッド
  // async getAppFormFields(appId: number)
  // async getAppFormLayout(appId: number)
  // async getAppViews(appId: number)
}
