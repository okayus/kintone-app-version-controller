/**
 * バージョン管理サービス
 * アプリのバージョン情報を管理するためのサービスクラス
 */
import deepEqual from 'deep-equal';
import * as diff from 'diff';

import { ApiClient } from '../utils/api-client';
import { AppDetail, VersionInfo, VersionDiff } from '../types';
import { APP_IDS, VERSION_FIELD_CODES } from '../constants';
import { generateVersionNumber, getCurrentTimestamp, normalizeRecord } from '../utils/helpers';

/**
 * バージョン管理サービスクラス
 */
export class VersionService {
  private apiClient: ApiClient;
  
  /**
   * コンストラクタ
   * @param apiClientOrBaseUrl ApiClientインスタンスまたはベースURL
   */
  constructor(apiClientOrBaseUrl?: ApiClient | string) {
    if (apiClientOrBaseUrl instanceof ApiClient) {
      // テスト用：既存のAPIクライアントを使用
      this.apiClient = apiClientOrBaseUrl;
    } else {
      // 新規APIクライアント作成
      this.apiClient = new ApiClient(apiClientOrBaseUrl);
    }
  }
  
  /**
   * アプリの現在の設定と最新バージョンを比較する
   * @param appId アプリID
   * @param appDetails アプリ詳細情報
   * @returns 変更があるかどうか
   */
  async compareAppVersions(appId: number, appDetails: AppDetail): Promise<boolean> {
    try {
      // 最新バージョンを取得
      const latestVersion = await this.getLatestVersion(appId);
      
      // 最新バージョンがない場合は変更ありとみなす
      if (!latestVersion) {
        return true;
      }
      
      // 深い比較を行う
      const isEqual = deepEqual(latestVersion.data, appDetails, { strict: true });
      return !isEqual;
    } catch (error) {
      console.error(`バージョン比較(アプリID: ${appId})中にエラーが発生しました`, error);
      // エラーの場合は安全のため変更ありとみなす
      return true;
    }
  }
  
  /**
   * 新しいバージョンを作成する
   * @param appId アプリID
   * @param appDetails アプリ詳細情報
   * @param comment バージョンコメント
   * @returns 作成されたバージョン情報
   */
  async createNewVersion(
    appId: number,
    appDetails: AppDetail,
    comment?: string
  ): Promise<VersionInfo> {
    try {
      // 最新バージョンを取得
      const latestVersion = await this.getLatestVersion(appId);
      
      // バージョン番号を生成
      const versionNumber = latestVersion
        ? generateVersionNumber(latestVersion.versionNumber, 'patch')
        : '0.1.0';
      
      // 現在のユーザー情報（実際の実装ではkintoneから取得）
      const currentUser = {
        code: 'dummy_user',
        name: 'テストユーザー',
      };
      
      // バージョン情報を作成
      const versionInfo: VersionInfo = {
        versionNumber,
        createdAt: getCurrentTimestamp(),
        createdBy: currentUser,
        data: appDetails,
        comment: comment || `アプリ「${appDetails.appInfo.name}」の設定変更`,
      };
      
      // バージョン管理システムに登録
      const record = {
        [VERSION_FIELD_CODES.APP_ID]: { value: appId.toString() },
        [VERSION_FIELD_CODES.APP_NAME]: { value: appDetails.appInfo.name },
        [VERSION_FIELD_CODES.VERSION_NUMBER]: { value: versionNumber },
        [VERSION_FIELD_CODES.CREATED_AT]: { value: versionInfo.createdAt },
        [VERSION_FIELD_CODES.CREATED_BY]: { value: [{ code: currentUser.code }] },
        [VERSION_FIELD_CODES.DATA]: { value: JSON.stringify(appDetails) },
        [VERSION_FIELD_CODES.COMMENT]: { value: versionInfo.comment },
      };
      
      await this.apiClient.postRecord(APP_IDS.APP_VERSION_CONTROL, record);
      
      return versionInfo;
    } catch (error) {
      console.error(`新規バージョン作成(アプリID: ${appId})中にエラーが発生しました`, error);
      throw error;
    }
  }
  
  /**
   * アプリの最新バージョンを取得する
   * @param appId アプリID
   * @returns 最新バージョン情報
   */
  async getLatestVersion(appId: number): Promise<VersionInfo | null> {
    try {
      // 最新バージョンを取得するクエリを作成
      const query = `${VERSION_FIELD_CODES.APP_ID} = "${appId}" order by ${VERSION_FIELD_CODES.CREATED_AT} desc limit 1`;
      
      // レコードを取得
      const records = await this.apiClient.getRecords(APP_IDS.APP_VERSION_CONTROL, query);
      
      // レコードがない場合はnullを返す
      if (records.length === 0) {
        return null;
      }
      
      // レコードを正規化
      const record = normalizeRecord(records[0]);
      
      // バージョン情報を作成
      const versionInfo: VersionInfo = {
        versionNumber: record[VERSION_FIELD_CODES.VERSION_NUMBER],
        createdAt: record[VERSION_FIELD_CODES.CREATED_AT],
        createdBy: {
          code: record[VERSION_FIELD_CODES.CREATED_BY][0].code,
          name: record[VERSION_FIELD_CODES.CREATED_BY][0].name || '',
        },
        data: JSON.parse(record[VERSION_FIELD_CODES.DATA]),
        comment: record[VERSION_FIELD_CODES.COMMENT],
      };
      
      return versionInfo;
    } catch (error) {
      console.error(`最新バージョン取得(アプリID: ${appId})中にエラーが発生しました`, error);
      return null;
    }
  }
  
  /**
   * アプリのバージョン履歴を取得する
   * @param appId アプリID
   * @param limit 取得件数
   * @returns バージョン履歴
   */
  async getVersionHistory(appId: number, limit = 10): Promise<VersionInfo[]> {
    try {
      // バージョン履歴を取得するクエリを作成
      const query = `${VERSION_FIELD_CODES.APP_ID} = "${appId}" order by ${VERSION_FIELD_CODES.CREATED_AT} desc limit ${limit}`;
      
      // レコードを取得
      const records = await this.apiClient.getRecords(APP_IDS.APP_VERSION_CONTROL, query);
      
      // バージョン情報のリストを作成
      return records.map(record => {
        const normalizedRecord = normalizeRecord(record);
        
        return {
          versionNumber: normalizedRecord[VERSION_FIELD_CODES.VERSION_NUMBER],
          createdAt: normalizedRecord[VERSION_FIELD_CODES.CREATED_AT],
          createdBy: {
            code: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].code,
            name: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].name || '',
          },
          data: JSON.parse(normalizedRecord[VERSION_FIELD_CODES.DATA]),
          comment: normalizedRecord[VERSION_FIELD_CODES.COMMENT],
        };
      });
    } catch (error) {
      console.error(`バージョン履歴取得(アプリID: ${appId})中にエラーが発生しました`, error);
      return [];
    }
  }
  
  /**
   * バージョン間の差分を生成する
   * @param oldVersion 古いバージョン
   * @param newVersion 新しいバージョン
   * @returns 差分情報
   */
  generateDiff(oldVersion: VersionInfo, newVersion: VersionInfo): VersionDiff[] {
    // JSONに変換して比較
    const oldJson = JSON.stringify(oldVersion.data, null, 2);
    const newJson = JSON.stringify(newVersion.data, null, 2);
    
    // 差分を計算
    const changes = diff.diffJson(JSON.parse(oldJson), JSON.parse(newJson));
    
    // 差分情報のリストを作成
    const diffs: VersionDiff[] = [];
    
    changes.forEach(change => {
      if (change.added) {
        diffs.push({
          path: '', // 実際の実装ではJSONパスを特定する処理が必要
          oldValue: null,
          newValue: change.value,
          changeType: 'added',
        });
      } else if (change.removed) {
        diffs.push({
          path: '', // 実際の実装ではJSONパスを特定する処理が必要
          oldValue: change.value,
          newValue: null,
          changeType: 'removed',
        });
      } else if (change.value.trim() !== '') {
        diffs.push({
          path: '', // 実際の実装ではJSONパスを特定する処理が必要
          oldValue: change.value,
          newValue: change.value,
          changeType: 'modified',
        });
      }
    });
    
    return diffs;
  }
}
