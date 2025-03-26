/**
 * kintoneアプリバージョン管理システム メイン処理
 */
import { AppService } from './services/app-service';
import { VersionService } from './services/version-service';
import { ApiClient } from './utils/api-client';
import { APP_IDS } from './constants';

/**
 * アプリバージョン管理システムクラス
 */
export class AppVersionController {
  private apiClient: ApiClient;
  private appService: AppService;
  private versionService: VersionService;
  
  /**
   * コンストラクタ
   * @param baseUrl kintoneのベースURL（オプション）
   */
  constructor(baseUrl?: string) {
    // API通信クライアントを初期化
    this.apiClient = new ApiClient(baseUrl);
    
    // サービスを初期化
    this.appService = new AppService(this.apiClient);
    this.versionService = new VersionService(this.apiClient);
  }
  
  /**
   * すべてのアプリのバージョンをチェックし、変更があれば新しいバージョンを作成する
   * @param targetAppIds 対象アプリIDの配列
   * @param options オプション
   * @returns 処理結果
   */
  async checkAllAppsVersions(
    targetAppIds?: number[],
    options: { 
      autoCreate?: boolean;  // 自動的に新しいバージョンを作成するかどうか
      checkLimit?: number;   // チェックするアプリ数の上限
      excludeList?: number[];// 除外アプリIDのリスト
    } = {}
  ): Promise<{ 
    checked: number;         // チェックしたアプリ数
    updated: number;         // 更新があったアプリ数
    created: number;         // 新規バージョンを作成したアプリ数
    errors: Array<{ appId: number; message: string }>;  // エラーリスト
  }> {
    // オプションのデフォルト値を設定
    const opts = {
      autoCreate: true,      // デフォルトでは自動作成
      checkLimit: 50,        // デフォルトは最大50アプリ
      excludeList: [],       // デフォルトは除外なし
      ...options
    };
    
    // 結果オブジェクトを初期化
    const result = {
      checked: 0,
      updated: 0,
      created: 0,
      errors: []
    };
    
    try {
      // 対象のアプリリストを取得
      let appIdList: number[] = [];
      
      if (targetAppIds && targetAppIds.length > 0) {
        // 指定されたアプリIDを使用
        appIdList = targetAppIds;
      } else {
        // アプリ一覧から取得
        const allApps = await this.appService.getAllApps();
        appIdList = allApps
          .filter(app => !opts.excludeList.includes(parseInt(app.appId)))
          .map(app => parseInt(app.appId));
      }
      
      // チェック上限を適用
      if (appIdList.length > opts.checkLimit) {
        appIdList = appIdList.slice(0, opts.checkLimit);
      }
      
      // 各アプリを処理
      for (const appId of appIdList) {
        try {
          result.checked++;
          
          // アプリ詳細情報を取得
          const appDetails = await this.appService.getAppDetails(appId);
          
          // 最新バージョンとの比較
          const hasChanges = await this.versionService.compareAppVersions(appId, appDetails);
          
          if (hasChanges) {
            result.updated++;
            
            // 自動作成が有効な場合は新しいバージョンを作成
            if (opts.autoCreate) {
              await this.versionService.createNewVersion(
                appId, 
                appDetails, 
                `アプリ「${appDetails.appInfo.name}」の設定変更をバージョン管理システムが検出して自動保存`
              );
              result.created++;
            }
          }
        } catch (error) {
          // エラー情報を記録
          result.errors.push({
            appId,
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`アプリバージョンチェック処理でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 特定のアプリの最新バージョンと現在の設定を比較し、差分を取得する
   * @param appId アプリID
   * @returns 差分情報
   */
  async compareCurrentWithLatestVersion(appId: number): Promise<{
    hasChanges: boolean;
    currentAppDetail: any;
    latestVersion: any;
    differences: any[];
  }> {
    try {
      // 現在のアプリ情報を取得
      const currentAppDetail = await this.appService.getAppDetails(appId);
      
      // 最新バージョンを取得
      const latestVersion = await this.versionService.getLatestVersion(appId);
      
      if (!latestVersion) {
        // 最新バージョンがない場合
        return {
          hasChanges: true,
          currentAppDetail,
          latestVersion: null,
          differences: [{
            path: '',
            oldValue: null,
            newValue: currentAppDetail,
            changeType: 'added'
          }]
        };
      }
      
      // 変更をチェック
      const hasChanges = !latestVersion || await this.versionService.compareAppVersions(appId, currentAppDetail);
      
      // 差分を取得
      const differences = hasChanges && latestVersion 
        ? this.versionService.generateDiff({
            ...latestVersion,
            // 現在のデータを追加
            data: latestVersion.data
          }, {
            // 仮のバージョン情報を作成
            versionNumber: latestVersion.versionNumber + 1,
            createdAt: new Date().toISOString(),
            createdBy: { code: 'system', name: 'システム' },
            comment: '現在の状態との比較',
            data: currentAppDetail
          })
        : [];
      
      return {
        hasChanges,
        currentAppDetail,
        latestVersion,
        differences
      };
    } catch (error) {
      throw new Error(`アプリの最新バージョンとの比較でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 新しいバージョンを手動で作成する
   * @param appId アプリID
   * @param comment バージョンコメント
   * @returns 作成されたバージョン情報
   */
  async createNewVersionManually(appId: number, comment?: string): Promise<any> {
    try {
      // アプリ情報を取得
      const appDetails = await this.appService.getAppDetails(appId);
      
      // 新しいバージョンを作成
      return await this.versionService.createNewVersion(appId, appDetails, comment);
    } catch (error) {
      throw new Error(`手動バージョン作成でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * アプリのバージョン履歴を取得する
   * @param appId アプリID
   * @param limit 取得件数
   * @returns バージョン履歴
   */
  async getAppVersionHistory(appId: number, limit?: number): Promise<any[]> {
    try {
      return await this.versionService.getVersionHistory(appId, limit);
    } catch (error) {
      throw new Error(`バージョン履歴取得でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * アプリのバージョン概要一覧を取得する
   * @param appId アプリID
   * @param limit 取得件数
   * @returns バージョン概要一覧
   */
  async getAppVersionSummaries(appId: number, limit?: number): Promise<any[]> {
    try {
      return await this.versionService.getVersionSummaries(appId, limit);
    } catch (error) {
      throw new Error(`バージョン概要一覧取得でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 指定されたバージョンを復元する
   * @param versionId バージョンID
   * @param options 復元オプション
   * @returns 復元結果
   */
  async restoreAppVersion(versionId: string, options?: any): Promise<any> {
    try {
      return await this.versionService.restoreVersion(versionId, options);
    } catch (error) {
      throw new Error(`バージョン復元でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 2つのバージョンを比較する
   * @param oldVersionId 古いバージョンのID
   * @param newVersionId 新しいバージョンのID
   * @returns 比較結果
   */
  async compareVersions(oldVersionId: string, newVersionId: string): Promise<any> {
    try {
      return await this.versionService.compareVersions(oldVersionId, newVersionId);
    } catch (error) {
      throw new Error(`バージョン比較でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * kintoneイベントハンドラー登録
 */
(function() {
  'use strict';
  
  // グローバルインスタンス
  const controller = new AppVersionController();
  
  // アプリ一覧（382）のレコード詳細画面が表示されたとき
  kintone.events.on('app.record.detail.show', function(event) {
    if (event.appId !== APP_IDS.APP_LIST) return event;
    
    // 取得したアプリIDでバージョン情報を表示する処理...
    const appId = parseInt(event.record.appId.value);
    
    // インラインでバージョン履歴を取得して表示
    controller.getAppVersionSummaries(appId, 5)
      .then(versions => {
        // 処理結果を表示...
        console.log('最新のバージョン履歴:', versions);
      })
      .catch(err => {
        console.error('バージョン情報取得エラー:', err);
      });
    
    return event;
  });
  
  // その他のイベントハンドラー...
})();
