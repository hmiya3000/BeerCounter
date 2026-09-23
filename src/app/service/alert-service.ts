import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone'; 

// インプットの個別設定用インターフェース
interface AlertInputConfig {
  placeholder: string;
  value: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'tel'; // 必要に応じて拡張
  attributes: {
    maxlength?: number;
    min?: number;
    max?: number;
    inputmode?: string;
    autofocus?: boolean;
  };
  trimOnSave: boolean; // 保存時にトリミングするかどうか
}
@Injectable({
  providedIn: 'root',
})
export class AlertService {
  

  constructor(
    private altCtrl: AlertController
  ) {}
  //===========================================================================
  //キーボードなし
  public async showAlert1bMessage(_header:string, _message:string) : Promise<void>  {
    return this.showBaseStandardAlert({
      header: _header,
      message: _message,
      buttons: [
        {
          text: '閉じる',
          handler: () => {}
        }
      ]
    });
  }
  public async showAlert2bExec(_header:string, _message:string, handler: () => void) : Promise<void> {
    return this.showBaseStandardAlert({
      header: _header,
      message: _message,
      buttons: [
        {
          text: '実行',
          role: 'destructive',
          handler: () => handler()
        },
        {
          text: 'キャンセル',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
  }
  public async showAlert2bInputs(_header:string, _inputs:any,  handler: (inData: any) => void) : Promise<void>  {
    return this.showBaseStandardAlert({
      header: _header,
      inputs: _inputs,
      buttons: [
        {
          text: '実行',
          role: 'destructive',
          handler: (data: any) => handler(data)
        },
        {
          text: 'キャンセル',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
  }
  private async showBaseStandardAlert(options: {
    header: string;
    message?: string;
    inputs?: any[];
    buttons: any[];
  }): Promise<void> {
    const prompt = await this.altCtrl.create({
      header: options.header,
      message: options.message,
      inputs: options.inputs,
      buttons: options.buttons
    });

    await prompt.present();
    await prompt.onDidDismiss();
  }  
  //===========================================================================
  //キーボードあり
  public async showAlert2bInStr(_header:string, _message:string, _value:string ,_placeholder:string, _maxLength:number,  handler: (inData: string) => void) : Promise<void>  {
   return this.showBaseCustomAlert(_header, _message, handler, {
      placeholder: _placeholder,
      value: _value,
      trimOnSave: true,
      attributes: {
        maxlength: _maxLength
      }
    });
  }
  public async showAlert2bInNum(_header:string, _message:string, _value:string ,_placeholder:string,  _min:number, _max:number, handler: (inData: string) => void) : Promise<void>  {
    return this.showBaseCustomAlert(_header, _message, handler, {
      placeholder: _placeholder,
      value: _value,
      type: 'text',
      trimOnSave: false,
      attributes: {
        min: _min,
        max: _max,
        inputmode: 'numeric',
        autofocus: false
      }
    });
  }
  //===========================================================================
  private async showBaseCustomAlert(
    header: string,
    message: string,
    handler: (inData: string) => void,
    inputConfig: AlertInputConfig
  ): Promise<void> {
    
    const prompt = await this.altCtrl.create({
      header: header,
      message: message,
      cssClass: 'top-alert',
      inputs: [
        {
          name: 'inData',
          placeholder: inputConfig.placeholder,
          value: inputConfig.value,
          type: inputConfig.type,
          attributes: inputConfig.attributes,
        },
      ],
      buttons: [
        {
          text: '保存',
          handler: (data) => {
            const rawValue = data.inData || '';
            const processedValue = inputConfig.trimOnSave ? rawValue.trim() : rawValue;
            handler(processedValue);
          }
        },
        {
          text: 'キャンセル',
          role: 'cancel',
          handler: () => {
            // Android 15等のキーボード残存バグを防ぐため、アクティブ要素を強制アンフォーカス
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur(); 
            }
            // showAlert2bInNum側にあった安全なdismissとディレイ処理を共通側に集約
            prompt.dismiss();
            return false;       
          }
        },  
      ]
    });
    // 共通のフォーカスハック（表示完了後にインプットへフォーカスしてキーボードを立ち上げる）
    prompt.addEventListener('ionAlertDidPresent', () => {
      setTimeout(() => {
        const inputEl = document.querySelector('.alert-wrapper .alert-input') as HTMLElement;
        if (inputEl) {
          inputEl.focus();
        }
      }, 300); 
    });
    await prompt.present();
    await prompt.onDidDismiss();
  }  
  //===========================================================================
}