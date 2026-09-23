import { Injectable } from '@angular/core';
import { APP_CONFIG } from '../../config/app.constants';
import { environment } from '../../../../src/environments/environment';
import { Router } from '@angular/router';
import { Nav } from 'src/app/utils/util';

export interface ModeProperty {
    id:             number;
    name:           string;
    reveneuName:    string;
    withAd:         boolean;
    opexInput:      boolean;
    longTerm:       boolean;
    analysis:       boolean;
    database:       boolean;
    network:        boolean;
}
@Injectable({
  providedIn: 'root',
})
export class AppmodeService {

  private  _modeNumber: number    = 0;
  //---
  public  upgradePackages: any[] = [];

  private  _appPages: {title:string,url:string,icon:string}[] = [];
  private features:string[]        = [ 'premium_features','standard_features','lite_features'];


  public modeProp: ModeProperty[] = [
    {id:0, name:"Free",       reveneuName:'free',     withAd:true,  opexInput:false,  longTerm:false, analysis:false, database:false, network:false},
    {id:1, name:"Lite",       reveneuName:'lite',     withAd:false, opexInput:true,   longTerm:true,  analysis:false, database:false, network:false},  //400円
    {id:2, name:"Standalone", reveneuName:'standard', withAd:false, opexInput:true,   longTerm:true,  analysis:true,  database:true,  network:false},  //400円
    {id:3, name:"Network",    reveneuName:'premium',  withAd:false, opexInput:true,   longTerm:true,  analysis:true,  database:true,  network:true},   //400円

  ];
  //===========================================================================
  constructor(
    private router: Router,
  ) {
  }
  public async initialize(){
    let features:string[] = [];
    for (let i = this.modeProp.length-1; i > 0; i--){
      features.push( this.modeProp[i].reveneuName + '_features')
    }
/**
    await this.billingSvc.initialize( features);
    //---
    let id:number = this.modeProp.length -1;
    for ( let f of this.features){
      if (this.billingSvc.isActiveFeattures(f)){
        break;
      }
      id--;
    }
    //---
    this.upgradePackages = await  this.getUpgradePackages(id);
 * 
 */


//    this._modeNumber  = id;
//    console.log('[Appmode]modeNumber:',this._modeNumber);
//    console.log('[Appmode]:',this.modeProp[this._modeNumber].name);
  }
  public async getUpgradePackages( id:number){
/**
    let _upgradePackages: any[] = [];
    if (this.modeProp[id].id !== this.modeProp.length -1){
      _upgradePackages  = await this.billingSvc.getUpgradePackages( this.modeProp[id].reveneuName );
    }
    return _upgradePackages;
 * 
 */
  }

  public readBackup(){
    if('_modeNumber' in localStorage){
      this._modeNumber = JSON.parse(localStorage['_modeNumber']);
      if (this._modeNumber >= this.modeProp.length){
        this._modeNumber  = this.modeProp[0].id;
      }
    }
    localStorage['_modeNumber']   = JSON.stringify(this._modeNumber);
  }
  public clearBackup(){
    ///クリアしない
  }
  public clearBackupDebug(){
    localStorage.removeItem('_modeNumber');
  }
  //===========================================================================
  public async clickBuy(): Promise<void> {
/**
    // 1行呼ぶだけで、Apple公式の「ダブルクリックで支払い」の美しい決済画面が立ち上がります
    const success = await this.billingSvc.purchasePremium();
    
    if (success) {
      alert('ご購入ありがとうございました！プレミアム機能が利用可能になりました。');
    }
 * 
 */
  }
  public async clickRestore(): Promise<void> {
/**
    await this.billingSvc.clickRestore();
 *  */
  }
  //===========================================================================
  public info(_modeIndex?: number) : { withAd:boolean, opexInput:boolean, longTerm:boolean, analysis:boolean, database:boolean, network:boolean}{
    const targetMode = _modeIndex !== undefined && _modeIndex !== null ? _modeIndex : this._modeNumber;
    return {
      withAd:     this.modeProp[targetMode].withAd,
      opexInput:  this.modeProp[targetMode].opexInput,
      longTerm:   this.modeProp[targetMode].longTerm,
      analysis:   this.modeProp[targetMode].analysis,
      database:   this.modeProp[targetMode].database,
      network:    this.modeProp[targetMode].network,
    }
  }
  public getModeInfo(_modeIndex?: number): {index:number, name:string}{

    const targetMode = _modeIndex !== undefined && _modeIndex !== null ? _modeIndex : this._modeNumber;
    var idx = 0;
    if (targetMode < this.modeProp.length){
      idx = targetMode;
    }
    return {index:targetMode, name:this.modeProp[idx].name};
  }
  public arrAppModeLength(){
    return this.modeProp.length;
  }
  public changeAppMode(data:any){
    this._modeNumber = Number(data);
    localStorage['_modeNumber']    = JSON.stringify(this._modeNumber);
    this.modeChangeNew();
  }
  //===========================================================================
  private modeChangeNew(){
    if (this.info().database) {
      Nav.to(this.router, 'tab-party/info');
    } else {
    }
  }  
  //===========================================================================
}

