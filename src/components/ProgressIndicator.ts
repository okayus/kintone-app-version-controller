/**
 * 進捗インジケーターコンポーネント
 */

/**
 * 進捗インジケーターの設定オプション
 */
export interface ProgressIndicatorOptions {
  /** コンテナのID */
  id?: string;
  /** 最大値 */
  max?: number;
  /** 初期値 */
  value?: number;
  /** インジケーターの幅 */
  width?: string;
  /** インジケーターの高さ */
  height?: string;
  /** ラベルを表示するかどうか */
  showLabel?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 進捗インジケーターコンポーネント
 */
export class ProgressIndicator {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private label: HTMLDivElement;
  private max: number;
  private current: number;
  
  /**
   * コンストラクタ
   * @param options 進捗インジケーターのオプション
   */
  constructor(options: ProgressIndicatorOptions = {}) {
    this.max = options.max || 100;
    this.current = options.value || 0;
    
    // コンテナの作成
    this.container = document.createElement('div');
    this.container.style.width = options.width || '100%';
    this.container.style.marginBottom = '10px';
    this.container.style.marginTop = '10px';
    this.container.className = 'progress-container';
    
    if (options.id) {
      this.container.id = options.id;
    }
    
    if (options.className) {
      this.container.classList.add(options.className);
    }
    
    // プログレスバーの外枠
    const progressOuter = document.createElement('div');
    progressOuter.style.width = '100%';
    progressOuter.style.height = options.height || '20px';
    progressOuter.style.backgroundColor = '#f0f0f0';
    progressOuter.style.borderRadius = '4px';
    progressOuter.style.overflow = 'hidden';
    progressOuter.style.border = '1px solid #ddd';
    
    // プログレスバー本体
    this.progressBar = document.createElement('div');
    this.progressBar.style.width = `${(this.current / this.max) * 100}%`;
    this.progressBar.style.height = '100%';
    this.progressBar.style.backgroundColor = '#4b9efa';
    this.progressBar.style.transition = 'width 0.3s ease';
    
    // ラベル
    this.label = document.createElement('div');
    this.label.style.textAlign = 'center';
    this.label.style.fontSize = '12px';
    this.label.style.marginTop = '5px';
    this.label.style.color = '#666';
    this.updateLabel();
    
    // 要素の組み立て
    progressOuter.appendChild(this.progressBar);
    this.container.appendChild(progressOuter);
    
    if (options.showLabel !== false) {
      this.container.appendChild(this.label);
    }
  }
  
  /**
   * プログレスバーの値を更新する
   * @param value 新しい値
   */
  public setValue(value: number): void {
    this.current = Math.max(0, Math.min(this.max, value));
    this.progressBar.style.width = `${(this.current / this.max) * 100}%`;
    this.updateLabel();
  }
  
  /**
   * プログレスバーの最大値を設定する
   * @param max 新しい最大値
   */
  public setMax(max: number): void {
    this.max = max > 0 ? max : 100;
    this.setValue(this.current); // 表示を更新
  }
  
  /**
   * 現在の値を取得する
   * @returns 現在の値
   */
  public getValue(): number {
    return this.current;
  }
  
  /**
   * 最大値を取得する
   * @returns 最大値
   */
  public getMax(): number {
    return this.max;
  }
  
  /**
   * 進捗率を取得する（0-100）
   * @returns 進捗率
   */
  public getPercentage(): number {
    return (this.current / this.max) * 100;
  }
  
  /**
   * ラベルを更新する
   */
  private updateLabel(): void {
    this.label.textContent = `${this.current} / ${this.max} (${Math.round(this.getPercentage())}%)`;
  }
  
  /**
   * DOMへ要素を追加する
   * @param parent 親要素または親要素のセレクタ
   */
  public render(parent: HTMLElement | string): void {
    const parentElement = typeof parent === 'string'
      ? document.querySelector<HTMLElement>(parent)
      : parent;
    
    if (!parentElement) {
      throw new Error('Parent element not found');
    }
    
    parentElement.appendChild(this.container);
  }
  
  /**
   * 要素を削除する
   */
  public remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
