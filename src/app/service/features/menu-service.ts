import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import drinkMenuJson from '../../../assets/drink.json';
import { ITextValuePair } from 'src/app/interface/drink';

export interface IDaiBunruiGroup {
  daiBunrui:    string;
  bunrui:       IBunrui[];
}
export interface IBunrui {
  name:         string;
  strContent:   string;
  items:        IMenuItem[];
}
export interface IMenuItem {
  大分類:       string;   // 親分類（例: "店"、"家"）
  分類:         string;   // 子分類（例: "ウイスキー"）
  補足:         string;
  分量:         string;
  容器:         string;
  濃度:         string;
  ID:           number;
  name:         string;
  ml:           number;
  alContent:    number;   // アルコール度数（例: 0.05）
  alMin:        number;
  alMax:        number;
  alStep:       number;
  glass:        string;   // 容器（例: "シングル"）
  coef:         number;   // 係数
  tips:         string;
  __rowNum__?:  number;   // Excelライブラリが自動付与する行番号（任意）
}
//===========================================================================
@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private isMenuLoaded$ = new BehaviorSubject<boolean>(false);
  public menu: IDaiBunruiGroup[]                      = [];
  public isShop:boolean                               = true;
  public  uniqueNameAlPairs:ITextValuePair[]          = [];
  public  uniqueGlassMlPairs:ITextValuePair[]         = [];
  //---
  private coefMap: { [itemId: number]: number }       = {};
  private alContentMap: { [itemId: number]: number }  =  {};
  //---

  //===========================================================================
  public async initialize(){
    const retVal  = await this.makeMenuList();
    if (retVal !== null){
      this.menu = retVal;
      this.extractUniquePairArrays(this.menu);
    }
    this.isMenuLoaded$.next(true);
  }
  public readBackup(){
    if ('coefMap' in localStorage){
      this.coefMap          = JSON.parse(localStorage['coefMap']);
    }
    this.coefMap  = [];
    if ('isShop' in localStorage){
      this.isShop           = JSON.parse(localStorage['isShop']);
    }
  }
  public clearBackup(){
    localStorage.removeItem('isShop');
    localStorage.removeItem('coefMap');
    localStorage.removeItem('heightMug');
    this.isShop     = true;
    this.coefMap    = [];
  }
  public clearBackupDebug(){
    this.clearBackup();
  }

  //===========================================================================
  public get menuLoaded$(): Observable<boolean> {
    return this.isMenuLoaded$.asObservable();
  }
  public changeShop(){
    this.isShop   = !this.isShop;
    localStorage['isShop']   = JSON.stringify(this.isShop);
  }
  public getMenuItem( _itemId:number): IMenuItem | null {
    const foundItem = this.findMenuById(_itemId);
    if (foundItem) {
      return foundItem;
    } else {
      return null;
    }
  }
  public getMenuItemByName(name:string, glass:string ): IMenuItem | null {
    const menu = this.findMenu(name,glass);
    return menu;

  }
  public getMlRangeStep( _baseMl:number): { range:number, step:number}{
    let _mlRange:number = 0;
    let _mlStep:number  = 0;
    if (_baseMl < 100){
      _mlStep           = 1;
      _mlRange          = Math.ceil(_baseMl * 0.10 / 10)*10 ;
    } else if (_baseMl < 400){
      _mlStep           = 5;
      _mlRange          = Math.ceil(_baseMl * 0.15 / 10)*10 ;
    } else {
      _mlStep           = 10;
      _mlRange          = Math.ceil(_baseMl * 0.10 / 10)*10 ;
    }
    return { range:_mlRange, step:_mlStep}
  }
  public getAlContent(_menuId: number): number {
    const alContent = this.alContentMap[_menuId];
    if (alContent !== undefined) return alContent;
    const menu = this.findMenuById(_menuId);
    return menu ? menu.alContent : 0.05;
  }
  public getCoef(_menuId: number): number {
    const coef = this.coefMap[_menuId];
    if (coef !== undefined) return coef;
    const menu = this.findMenuById(_menuId);
    return menu ? menu.coef : 1.0;
  }
  //---
  public setAlContent(_itemId: number, alContent: number) {
    const menu = this.findMenuById(_itemId);
    if (!menu) return; // マスタに存在しない場合は安全ガードで即終了
    if (menu.alContent === alContent) {
      delete this.alContentMap[_itemId]; // 初期値と同じならカスタム用Mapから削除
    } else {
      this.alContentMap[_itemId] = alContent; // 違っていればMapに記憶
    }
    localStorage['alContentMap'] = JSON.stringify(this.alContentMap);
  }
  public setCoef(_itemId: number, coef: number) {
    const menu = this.findMenuById(_itemId);
    if (!menu) return;
    if (menu.coef === coef) {
      delete this.coefMap[_itemId]; // 初期値と同じならカスタム用Mapから削除
    } else {
      this.coefMap[_itemId] = coef; // 違っていればMapに記憶
    }
    localStorage['coefMap'] = JSON.stringify(this.coefMap);
  }
  //---
  private findMenuById(_itemId: number): any | null {
    for (const group of this.menu) {
      for (const bunrui of group.bunrui) {
        for (const menu of bunrui.items) {
          if (menu.ID === _itemId) {
            return menu;
          }
        }
      }
    }
    return null; // マスタに見つからなかった場合
  }
  private findMenu(_name:string, _glass:string): IMenuItem | null {
    for (const group of this.menu) {
      for (const bunrui of group.bunrui) {
        for (const menu of bunrui.items) {
          if (menu.name === _name && menu.glass=== _glass){
            return menu;
          }
        }
      }
    }
    return null; // マスタに見つからなかった場合
  }
  private async makeMenuList() :  Promise<IDaiBunruiGroup[] | null>{
    const rawData = await this.loadFile('drink.json');
    if ( rawData === null){
      console.error('[Drink] loadfile error')
    } else {
      this.menu = [...rawData].sort((a: any, b: any) => {
        return Number(a.ID) - Number(b.ID);
      });
      const DaiBunrui_List: string[]        = [...new Set<string>(this.menu.map((item:any) => item.大分類))];
      const structured: IDaiBunruiGroup[]   = DaiBunrui_List.map(daiName => {      
        const filteredByDai           = this.menu.filter((item: any) => item.大分類 === daiName);
        const Bunrui_List: string[]   = [...new Set<string>(filteredByDai.map((item: any) => item.分類))];
        const childBunruiArray        = Bunrui_List.map(subName => {
          const finalItems:any[]      = filteredByDai.filter((item: any) => item.分類 === subName);
          const targetDensity = finalItems[0]?.濃度 ?? '0%';       
          return {
            name:       subName,
            strContent: targetDensity,
            items:      finalItems
          };
        });
        return {
          daiBunrui: daiName,
          bunrui: childBunruiArray
        };
      }) as any;
      return structured;
    }
    return null
  }
  private extractUniquePairArrays(treeData: IDaiBunruiGroup[]) {
    const nameAlSeen  = new Set<string>();
    const glassMlSeen = new Set<string>();
    const nameAlPairs:  ITextValuePair[]   = [];
    const glassMlPairs: ITextValuePair[] = [];
    if (!treeData || treeData.length === 0) return;
    for (const group of treeData) {
      for (const sub of group.bunrui) {
        for (const item of sub.items) {
          const nameAlKey = `${item.name}_${item.alContent}`;
          if (!nameAlSeen.has(nameAlKey)) {
            nameAlSeen.add(nameAlKey);
            nameAlPairs.push({  text: item.name,  value: item.alContent });
          }
          const glassMlKey = `${item.glass}_${item.ml}`;
          if (!glassMlSeen.has(glassMlKey)) {
            glassMlSeen.add(glassMlKey);
            glassMlPairs.push({ text:   item.glass, value: item.ml  });
          }
        }
      }
    }
    nameAlPairs.sort((a, b) => a.text.localeCompare(b.text, 'ja'));
    glassMlPairs.sort((a, b) => a.value - b.value);
    console.log(`[PairExtract] 🏆 2つのユニークペア配列が完成しました！`);
    console.log(`- 品名×度数リスト (${nameAlPairs.length}件):`, nameAlPairs);
    console.log(`- 容器×分量リスト (${glassMlPairs.length}件):`, glassMlPairs);
    this.uniqueNameAlPairs  = nameAlPairs;
    this.uniqueGlassMlPairs = glassMlPairs;
  }
  private async loadFile( filename: string ): Promise<any[] | null> {
    try {
      console.log(`[LocalJson] 🚀 呼び出し形式を維持したまま、${filename}（JSON互換）の即時ロードを開始します。`);
      const jsonData = drinkMenuJson;
      console.log(`[LocalJson] 🏆 メモリからの展開に大成功しました。総データ件数: ${jsonData.length} 件`);
      return jsonData;
    } catch (e) {
      console.error('[LocalJson] ローカルデータ読み込み中に予期せぬ例外エラーが発生しました:', e);
      return null; // 🤝 従来の規約通り、エラー時は null を返却します
    }    
  }

//===========================================================================
}
