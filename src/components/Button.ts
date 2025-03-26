/**
 * ボタンコンポーネント
 */

/**
 * ボタンのスタイルタイプ
 */
export type ButtonStyle = 'primary' | 'secondary' | 'danger' | 'normal';

/**
 * ボタンの設定オプション
 */
export interface ButtonOptions {
  /** ボタンのテキスト */
  text: string;
  /** クリック時のコールバック関数 */
  onClick: (event: MouseEvent) => void;
  /** ボタンのスタイル */
  style?: ButtonStyle;
  /** ボタンのID */
  id?: string;
  /** ボタンの無効化状態 */
  disabled?: boolean;
  /** ボタンの追加クラス名 */
  className?: string;
}

/**
 * スタイルごとのCSSクラス
 */
const STYLE_CLASSES: Record<ButtonStyle, string> = {
  primary: 'kintoneplugin-button-normal',
  secondary: 'kintoneplugin-button-dialog-cancel',
  danger: 'kintoneplugin-button-dialog-ok',
  normal: '',
};

/**
 * ボタンエレメントを作成する
 * @param options ボタンの設定オプション
 * @returns HTMLButtonElement
 */
export function createButton(options: ButtonOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = options.text;
  
  // スタイルの適用
  const styleClass = STYLE_CLASSES[options.style || 'normal'];
  if (styleClass) {
    button.classList.add(styleClass);
  }
  
  // 追加クラスの適用
  if (options.className) {
    button.classList.add(options.className);
  }
  
  // IDの設定
  if (options.id) {
    button.id = options.id;
  }
  
  // 無効化状態の設定
  if (options.disabled) {
    button.disabled = true;
  }
  
  // クリックイベントの設定
  button.addEventListener('click', options.onClick);
  
  return button;
}
