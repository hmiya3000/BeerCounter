import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilexlsxService {

  constructor(
    private http: HttpClient,
  ){

  }
  
  //===========================================================================
  public async loadFile( filename: string ): Promise<any[] | null> {
    try {
      console.log(`[LocalExcel] 🚀 アプリ内資産から ${filename} のロードを開始します。`);
      
      // 1. assets/ のパスを指定し、HttpClientでバイナリデータ（arraybuffer）として一撃で引き抜きます
      const url = `assets/${filename}`;
      const arrayBuffer = await firstValueFrom(
        this.http.get(url, { responseType: 'arraybuffer' })
      );

      console.log('[LocalExcel] ファイルの取得に成功しました。解析を開始します...');
      const xlsxModule = await import('xlsx');

      // 3. 読み込んだバイナリデータをそのままパース（解析）します
      const workbook = xlsxModule.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 4. 生のJSONオブジェクト配列に一瞬で一元変換します
      const jsonData = xlsxModule.utils.sheet_to_json(worksheet);

      console.log(`[LocalExcel] 🏆 パースに大成功しました。総データ件数: ${jsonData.length} 件`);
      return jsonData;

    } catch (e) {
      console.error('[LocalExcel] ローカルExcel読み込み中に重大な例外エラーが発生しました:', e);
      return null;
    }    
  }
  //===========================================================================
  public async downloadDataConvert( base64Data:any): Promise<any[] | null> {
    if (!base64Data) return null;

    const xlsxModule = await import('xlsx');

    const workbook = xlsxModule.read(base64Data, { type: 'base64' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = xlsxModule.utils.sheet_to_json(worksheet); 
    console.log(`[FileXlsx]  Excelのパースに成功しました。データ件数: ${jsonData.length} 件`);
    return jsonData;
  }
  //===========================================================================
  public async convertToBase64( jsonData: any[] ) : Promise<string> {
    const xlsxModule = await import('xlsx');

    console.log('[FileXlsx] Excelデータのバイナリ生成を開始します。データ数:', jsonData.length);

    const worksheet = xlsxModule.utils.json_to_sheet(jsonData);
    const workbook = xlsxModule.utils.book_new();
    xlsxModule.utils.book_append_sheet(workbook, worksheet, '物件リスト');
    const rawBuffer = xlsxModule.write(workbook, { bookType: 'xlsx', type: 'array' });

    const excelBuffer = new Uint8Array(rawBuffer);
    console.log('[FileXlsx] Excelバイナリが生成されました。サイズ:', excelBuffer.byteLength, 'バイト');
    const base64Data = this.uint8ArrayToBase64(excelBuffer);
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
