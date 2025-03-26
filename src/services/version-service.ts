/**
 * バージョン管理サービス
 * アプリのバージョン情報を管理するためのサービスクラス
 */
import deepEqual from 'deep-equal';
import * as diff from 'diff';

import { ApiClient } from '../utils/api-client';
import { AppService } from './app-service';
import { 
  AppDetail, 
  VersionInfo, 
  VersionDiff, 
  VersionSummary,
  VersionComparisonResult,
  VersionRestoreOptions,
  VersionCreationResult,
  IVersionService
} from '../types';
import { APP_IDS, VERSION_FIELD_CODES } from '../constants';
import { 
  generateVersionNumber, 
  getCurrentTimestamp, 
  normalizeRecord,
  getCurrentUser,
  generateDetailedJsonDiff,
  generateTextDiff,
  deepClone
} from '../utils/helpers';
import { MemoryCache } from '../utils/cache';

/**
 * バージョン管理サービスクラス
 */
export class VersionService implements IVersionService {
  private apiClient: ApiClient;
  private appService: AppService;
  private cache: MemoryCache<any>;
  
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
    
    // アプリサービスを初期化
    this.appService = new AppService(this.apiClient);
    
    // キャッシュを初期化
    this.cache = new MemoryCache();
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
        ? generateVersionNumber(latestVersion.versionNumber)
        : '1';
      
      // 現在のユーザー情報
      const currentUser = getCurrentUser();
      
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
      
      const result = await this.apiClient.postRecord(APP_IDS.APP_VERSION_CONTROL, record);
      
      // キャッシュをクリア
      this.clearVersionCache(appId);
      
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
      // キャッシュキー
      const cacheKey = `version_latest_${appId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
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
      
      // キャッシュに保存（30分）
      this.cache.set(cacheKey, versionInfo, 30 * 60 * 1000);
      
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
      // キャッシュキー
      const cacheKey = `version_history_${appId}_${limit}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // バージョン履歴を取得するクエリを作成
      const query = `${VERSION_FIELD_CODES.APP_ID} = "${appId}" order by ${VERSION_FIELD_CODES.CREATED_AT} desc limit ${limit}`;
      
      // レコードを取得
      const records = await this.apiClient.getRecords(APP_IDS.APP_VERSION_CONTROL, query);
      
      // バージョン情報のリストを作成
      const versions = records.map(record => {
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
      
      // キャッシュに保存（10分）
      this.cache.set(cacheKey, versions, 10 * 60 * 1000);
      
      return versions;
    } catch (error) {
      console.error(`バージョン履歴取得(アプリID: ${appId})中にエラーが発生しました`, error);
      return [];
    }
  }
  
  /**
   * アプリのバージョン概要一覧を取得する（詳細データなし）
   * @param appId アプリID
   * @param limit 取得件数
   * @returns バージョン概要一覧
   */
  async getVersionSummaries(appId: number, limit = 20): Promise<VersionSummary[]> {
    try {
      // キャッシュキー
      const cacheKey = `version_summaries_${appId}_${limit}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 必要なフィールドのみを取得
      const fields = [
        VERSION_FIELD_CODES.VERSION_NUMBER,
        VERSION_FIELD_CODES.CREATED_AT,
        VERSION_FIELD_CODES.CREATED_BY,
        VERSION_FIELD_CODES.COMMENT,
        VERSION_FIELD_CODES.APP_ID,
        VERSION_FIELD_CODES.APP_NAME
      ];
      
      // バージョン履歴を取得するクエリを作成
      const query = `${VERSION_FIELD_CODES.APP_ID} = "${appId}" order by ${VERSION_FIELD_CODES.CREATED_AT} desc limit ${limit}`;
      
      // レコードを取得（詳細データは取得しない）
      const records = await this.apiClient.getRecords(APP_IDS.APP_VERSION_CONTROL, query, fields);
      
      // バージョン概要のリストを作成
      const summaries = records.map(record => {
        const normalizedRecord = normalizeRecord(record);
        
        const summary: VersionSummary = {
          versionNumber: normalizedRecord[VERSION_FIELD_CODES.VERSION_NUMBER],
          createdAt: normalizedRecord[VERSION_FIELD_CODES.CREATED_AT],
          createdBy: {
            code: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].code,
            name: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].name || '',
          },
          comment: normalizedRecord[VERSION_FIELD_CODES.COMMENT],
          appId: normalizedRecord[VERSION_FIELD_CODES.APP_ID],
          appName: normalizedRecord[VERSION_FIELD_CODES.APP_NAME],
          recordId: record.$id.value, // レコードIDも保存
        };
        
        return summary;
      });
      
      // キャッシュに保存（5分）
      this.cache.set(cacheKey, summaries, 5 * 60 * 1000);
      
      return summaries;
    } catch (error) {
      console.error(`バージョン概要一覧取得(アプリID: ${appId})中にエラーが発生しました`, error);
      return [];
    }
  }
  
  /**
   * レコードIDを指定してバージョン情報を取得する
   * @param recordId レコードID
   * @returns バージョン情報
   */
  async getVersionById(recordId: string): Promise<VersionInfo | null> {
    try {
      // キャッシュキー
      const cacheKey = `version_record_${recordId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // レコードを取得
      const record = await this.apiClient.getRecords(
        APP_IDS.APP_VERSION_CONTROL, 
        `$id = "${recordId}"`,
        [] // すべてのフィールドを取得
      );
      
      // レコードがない場合はnullを返す
      if (record.length === 0) {
        return null;
      }
      
      // レコードを正規化
      const normalizedRecord = normalizeRecord(record[0]);
      
      // バージョン情報を作成
      const versionInfo: VersionInfo = {
        versionNumber: normalizedRecord[VERSION_FIELD_CODES.VERSION_NUMBER],
        createdAt: normalizedRecord[VERSION_FIELD_CODES.CREATED_AT],
        createdBy: {
          code: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].code,
          name: normalizedRecord[VERSION_FIELD_CODES.CREATED_BY][0].name || '',
        },
        data: JSON.parse(normalizedRecord[VERSION_FIELD_CODES.DATA]),
        comment: normalizedRecord[VERSION_FIELD_CODES.COMMENT],
      };
      
      // キャッシュに保存（30分）
      this.cache.set(cacheKey, versionInfo, 30 * 60 * 1000);
      
      return versionInfo;
    } catch (error) {
      console.error(`バージョン情報取得(レコードID: ${recordId})中にエラーが発生しました`, error);
      return null;
    }
  }
  
  /**
   * バージョン間の差分を生成する
   * @param oldVersion 古いバージョン
   * @param newVersion 新しいバージョン
   * @returns 差分情報
   */
  generateDiff(oldVersion: VersionInfo, newVersion: VersionInfo): VersionDiff[] {
    // データを取得
    const oldData = oldVersion.data;
    const newData = newVersion.data;
    
    // 詳細な差分比較を行う
    return generateDetailedJsonDiff(oldData, newData);
  }
  
  /**
   * 2つのバージョンを比較する
   * @param oldVersionId 古いバージョンのレコードID
   * @param newVersionId 新しいバージョンのレコードID
   * @returns 比較結果
   */
  async compareVersions(oldVersionId: string, newVersionId: string): Promise<VersionComparisonResult> {
    try {
      // バージョン情報を取得
      const [oldVersion, newVersion] = await Promise.all([
        this.getVersionById(oldVersionId),
        this.getVersionById(newVersionId),
      ]);
      
      if (!oldVersion || !newVersion) {
        throw new Error('バージョン情報の取得に失敗しました');
      }
      
      // 差分を生成
      const diffs = this.generateDiff(oldVersion, newVersion);
      
      // 差分の統計情報を計算
      const diffStats = {
        added: diffs.filter(d => d.changeType === 'added').length,
        removed: diffs.filter(d => d.changeType === 'removed').length,
        modified: diffs.filter(d => d.changeType === 'modified').length,
        total: diffs.length,
      };
      
      // テキスト形式の差分も生成
      const oldText = JSON.stringify(oldVersion.data, null, 2);
      const newText = JSON.stringify(newVersion.data, null, 2);
      const diffText = generateTextDiff(oldText, newText);
      
      return {
        oldVersion,
        newVersion,
        diffs,
        diffStats,
        diffText,
        timestamp: getCurrentTimestamp(),
      };
    } catch (error) {
      console.error(`バージョン比較中にエラーが発生しました`, error);
      throw error;
    }
  }
  
  /**
   * 指定されたバージョンを復元する
   * @param versionId 復元するバージョンのレコードID
   * @param options 復元オプション
   * @returns 復元結果
   */
  async restoreVersion(versionId: string, options?: VersionRestoreOptions): Promise<VersionCreationResult> {
    try {
      // 復元するバージョン情報を取得
      const versionToRestore = await this.getVersionById(versionId);
      if (!versionToRestore) {
        throw new Error(`バージョン(ID: ${versionId})が見つかりません`);
      }
      
      // アプリIDを取得
      const appId = parseInt(versionToRestore.data.appInfo.appId);
      
      // オプション設定
      const opts: VersionRestoreOptions = {
        restoreFields: true,
        restoreLayout: true,
        restoreViews: true,
        restoreCustomize: true,
        restoreSettings: true,
        ...options,
      };
      
      // 現在のアプリ詳細情報を取得
      const currentAppDetail = await this.appService.getAppDetails(appId);
      
      // 復元用のアプリ詳細情報を作成
      const restoredAppDetail = deepClone(currentAppDetail);
      
      // 指定されたセクションを復元
      if (opts.restoreFields) {
        restoredAppDetail.fields = versionToRestore.data.fields;
      }
      
      if (opts.restoreLayout) {
        restoredAppDetail.layout = versionToRestore.data.layout;
      }
      
      if (opts.restoreViews) {
        restoredAppDetail.views = versionToRestore.data.views;
      }
      
      if (opts.restoreCustomize && versionToRestore.data.customize) {
        restoredAppDetail.customize = versionToRestore.data.customize;
      }
      
      if (opts.restoreSettings && versionToRestore.data.settings) {
        restoredAppDetail.settings = versionToRestore.data.settings;
      }
      
      // 復元コメント
      const comment = opts.comment || 
        `バージョン ${versionToRestore.versionNumber} からの復元 (${versionToRestore.createdAt.split('T')[0]})`;
      
      // ユーザー情報
      const user = opts.restoredBy || getCurrentUser();
      
      // 新しいバージョンとして保存
      const version = await this.createNewVersion(appId, restoredAppDetail, comment);
      
      // 結果を返す
      return {
        version,
        recordId: versionId, // 復元元のレコードID
        success: true,
        backupTimestamp: getCurrentTimestamp(),
      };
    } catch (error) {
      console.error(`バージョン復元中にエラーが発生しました`, error);
      throw error;
    }
  }
  
  /**
   * 指定された日付範囲のバージョンを取得する
   * @param appId アプリID
   * @param startDate 開始日（ISO形式）
   * @param endDate 終了日（ISO形式）
   * @returns バージョン情報のリスト
   */
  async getVersionsByDateRange(appId: number, startDate: string, endDate: string): Promise<VersionInfo[]> {
    try {
      // キャッシュキー
      const cacheKey = `version_range_${appId}_${startDate}_${endDate}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 日付範囲を指定したクエリを作成
      const query = `${VERSION_FIELD_CODES.APP_ID} = "${appId}" and ` +
        `${VERSION_FIELD_CODES.CREATED_AT} >= "${startDate}" and ` +
        `${VERSION_FIELD_CODES.CREATED_AT} <= "${endDate}" ` +
        `order by ${VERSION_FIELD_CODES.CREATED_AT} desc`;
      
      // レコードを取得
      const records = await this.apiClient.getRecords(APP_IDS.APP_VERSION_CONTROL, query);
      
      // バージョン情報のリストを作成
      const versions = records.map(record => {
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
      
      // キャッシュに保存（10分）
      this.cache.set(cacheKey, versions, 10 * 60 * 1000);
      
      return versions;
    } catch (error) {
      console.error(`日付範囲のバージョン取得中にエラーが発生しました`, error);
      return [];
    }
  }
  
  /**
   * バージョン関連のキャッシュをクリアする
   * @param appId アプリID
   */
  private clearVersionCache(appId: number): void {
    // アプリID関連のキャッシュをクリア
    this.cache.delete(`version_latest_${appId}`);
    this.cache.delete(`version_history_${appId}_10`);
    this.cache.delete(`version_history_${appId}_20`);
    this.cache.delete(`version_history_${appId}_50`);
    this.cache.delete(`version_summaries_${appId}_10`);
    this.cache.delete(`version_summaries_${appId}_20`);
    this.cache.delete(`version_summaries_${appId}_50`);
  }
}
