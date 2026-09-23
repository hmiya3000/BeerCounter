import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FilecsvService {
  
  //===========================================================================
  public async downloadDataConvert( data:any): Promise<string | null> {
    if (!data) return null;
    try {
      let base64String = '';
      if (data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = window.btoa(binary);
      } else if (typeof data === 'string') {
        base64String = data;
      } else if (typeof data === 'object' && (data as any).data) {
        base64String = (data as any).data;
      }
      if (base64String) {
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder('shift-jis');
        return decoder.decode(bytes); // ➔ 完璧な日本語CSVテキストが還ります
      }
      return String(data);
    } catch (decodeError) {
      console.error('[FileCsv] デコード処理中にエラーが発生しました:', decodeError);
      return String(data);
    }
  }
  //===========================================================================
  public async convertToBase64( csvText: string ) : Promise<string> {
    const encodingModule = await import('encoding-japanese');
    const realSjisBytes = new Uint8Array(
      encodingModule.convert(encodingModule.stringToCode(csvText), 'SJIS')
    );
    console.log(`[FileCsv] 本番用Shift-JISバイナリを作成しました。サイズ: ${realSjisBytes.byteLength} バイト`);
    const base64Data = this.uint8ArrayToBase64(realSjisBytes);
    return base64Data;
  }
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }
  //===========================================================================
}
