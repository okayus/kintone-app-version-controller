/**
 * ロガーユーティリティ
 * アプリケーション全体で一貫したログ出力を提供する
 */

// ログレベルの定義
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 現在の環境に基づいてログレベルを設定
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

/**
 * ログメッセージを整形する
 * @param level ログレベル
 * @param message メッセージ
 * @returns 整形されたログメッセージ
 */
const formatLogMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [kintone-app-version-controller] ${message}`;
};

/**
 * デバッグレベルのログを出力
 * @param message ログメッセージ
 * @param optionalParams 追加のパラメータ
 */
export const logDebug = (message: string, ...optionalParams: any[]): void => {
  if (shouldLog(LogLevel.DEBUG)) {
    console.debug(formatLogMessage(LogLevel.DEBUG, message), ...optionalParams);
  }
};

/**
 * 情報レベルのログを出力
 * @param message ログメッセージ
 * @param optionalParams 追加のパラメータ
 */
export const logInfo = (message: string, ...optionalParams: any[]): void => {
  if (shouldLog(LogLevel.INFO)) {
    console.info(formatLogMessage(LogLevel.INFO, message), ...optionalParams);
  }
};

/**
 * 警告レベルのログを出力
 * @param message ログメッセージ
 * @param optionalParams 追加のパラメータ
 */
export const logWarn = (message: string, ...optionalParams: any[]): void => {
  if (shouldLog(LogLevel.WARN)) {
    console.warn(formatLogMessage(LogLevel.WARN, message), ...optionalParams);
  }
};

/**
 * エラーレベルのログを出力
 * @param message ログメッセージ
 * @param optionalParams 追加のパラメータ
 */
export const logError = (message: string, ...optionalParams: any[]): void => {
  if (shouldLog(LogLevel.ERROR)) {
    console.error(formatLogMessage(LogLevel.ERROR, message), ...optionalParams);
  }
};

/**
 * 指定されたレベルのログを出力すべきかどうかを判定
 * @param level 判定するログレベル
 * @returns ログを出力すべきかどうか
 */
const shouldLog = (level: LogLevel): boolean => {
  const levels = Object.values(LogLevel);
  const currentLevelIndex = levels.indexOf(currentLogLevel);
  const targetLevelIndex = levels.indexOf(level);
  
  return targetLevelIndex >= currentLevelIndex;
};

/**
 * デフォルトエクスポート
 */
export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError
};
