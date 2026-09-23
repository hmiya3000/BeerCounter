import { Injectable } from '@angular/core';
import { Blood, Body, BodyFactor } from 'src/app/class/health';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { IAlcToleranceListItem, IBlood, IBody, IBodyFactor, IAlcToleranceInfo, AlcToleranceLevel } from 'src/app/interface/health';
import { Color, Num, Str, Util } from 'src/app/utils/util';
import { DateService } from '../infra/date-service';

export interface IBloodAlcohol {
  limit:        number;
  name:         string;
  color:        string;
  explain:      string;
}

@Injectable({
  providedIn: 'root',
})

export class HealthService {
  public static readonly BLOOD_ALCOHOL:IBloodAlcohol[]             = [
    {limit: 0.02, name:'正常',        color:'#F8F8F8', explain:''  },
    {limit: 0.05, name:'爽快期',      color:'#3cd3f2', explain:'爽やかな気分になる。皮膚が赤くなる、陽気になる。' },
    {limit: 0.11, name:'ほろ酔い期',  color:'#4c6ef5', explain:'理性の抑制が外れ、饒舌になる。体温が上がり、脈が速くなる。' },
    {limit: 0.16, name:'酩酊初期',    color:'#be4bdb', explain:'気が大きくなり、大声を出す。立つと足元がふらつく。' },
    {limit: 0.31, name:'酩酊期',      color:'#f06595', explain:'千鳥足になる、何度も同じ話を繰り返す。吐き気や嘔吐が起こる。' },
    {limit: 0.41, name:'泥酔期',      color:'#ff6b6b', explain:'まともに立てず、意識がはっきりしない。言語がめちゃくちゃになる。' },
    {limit: 1.00, name:'昏睡期',      color:'#e03131', explain:'揺り動かしても起きない（昏睡）。呼吸抑制が起こり、死亡の危険がある。' },
  ]
  private static readonly ALC_TOLERANCE: Record<AlcToleranceLevel, IAlcToleranceInfo> = {
    veryStrong: {name:'かなり強い', factor:1.50,  tips:'毎日飲んでおり、全く酔い潰れない人'},
    strong:     {name:'強い',       factor:1.25,  tips:'翌朝に残りにくい、お酒に強い人'},
    normal:     {name:'普通',       factor:1.00,  tips:'平均的な体質の人'},
    weak:       {name:'弱い',       factor:0.50,  tips:'カクテル1〜2杯で顔が赤くなる人'},
    veryWeak:   {name:'極めて弱い', factor:0.25,  tips:'奈良漬けやアルコールチョコでも赤くなる人'},
  };
  //「純アルコール1gにつき、約10ml〜11mlの水が尿として余分に排出される」
  private static readonly WATER_PER_ALCOHOL_G:number  =    11;

  public  isDataInputDone:boolean     = false;
  public  arrBody:IBody[]             = [];
  public  arrBlood:IBlood[]           = [];
  private bodyFactor:IBodyFactor      = new BodyFactor();

  //===========================================================================
  constructor(
    private  dateSvc: DateService,
   ){

  }
  //===========================================================================
  public async initialize(){
    this.readBackup();
    this.arrBody                = Util.sortAndResetIds(this.arrBody);
    localStorage['arrBody']     = JSON.stringify(this.arrBody);
    //---
    this.arrBlood               = Util.sortAndResetIds(this.arrBlood);
    localStorage['arrBlood']    = JSON.stringify(this.arrBlood);
  }
  public readBackup(){
    if ('arrBody' in localStorage){
      this.arrBody        = JSON.parse(localStorage['arrBody']);
    }
    if ('arrBlood' in localStorage){
      this.arrBlood       = JSON.parse(localStorage['arrBlood']);
    }
    if ('bodyFactor' in localStorage){
      this.bodyFactor     = JSON.parse(localStorage['bodyFactor']);
    }
    if ('isDataInputDone' in localStorage){
      this.isDataInputDone     = JSON.parse(localStorage['isDataInputDone']);
    }
  }
  public clearBackup(){
    localStorage.removeItem('isDataInputDone');
    this.isDataInputDone  = false;
  }
  public clearBackupDebug(){
    this.clearBackup();
    localStorage.removeItem('arrBody');
    localStorage.removeItem('arrBlood');
    localStorage.removeItem('bodyFactor');
    this.arrBody          = [];
    this.arrBlood         = [];
    this.bodyFactor       = new BodyFactor();
  }
  //===========================================================================
  public setDataInputDone(){
    this.isDataInputDone  = true;
    localStorage['isDataInputDone']  = JSON.stringify(this.isDataInputDone);
  }
  public setBodyInfo( _body:IBody){

    const _targetDateStr = _body.time.slice(0, 10);
    const _index = this.arrBody.findIndex( b => {
      if (!b.time){
        return false;
      } else {
        return b.time.slice(0,10) === _targetDateStr;
      }
    });
    if (_index < 0 ){
      this.arrBody.push( _body );
      this.arrBody              = Util.sortAndResetIds(this.arrBody);
    } else {
      const _id                 = this.arrBody[_index].id;
      this.arrBody[_index]      = _body;
      this.arrBody[_index].id   = _id
    }
    localStorage['arrBody']     = JSON.stringify(this.arrBody);    
  }
  public setBloodInfo( _blood:IBlood){
    const _targetDateStr = _blood.time.slice(0, 10);
    const _index = this.arrBlood.findIndex( b => { 
      if (!b.time){
        return false;
      } else {
        return b.time.slice(0,10) === _targetDateStr;
      }
    });
    if (_index < 0 ){
      this.arrBlood.push( _blood );
      this.arrBlood             = Util.sortAndResetIds(this.arrBlood);
    } else {
      const _id                 = this.arrBlood[_index].id;
      this.arrBlood[_index]     = _blood;
      this.arrBlood[_index].id  = _id
    }
    localStorage['arrBlood']    = JSON.stringify(this.arrBlood);
  }
  public setBodyFactorInfo( _bodyFactor:IBodyFactor){
    this.bodyFactor             = _bodyFactor;
    localStorage['bodyFactor']  = JSON.stringify(this.bodyFactor);
  }
  //===========================================================================
  public bodyInfo(  _isoDate:string ): IBody {
    if (this.arrBody.length === 0){
      const _retInfo = new Body(-1,_isoDate);
      return _retInfo;
    }
    const _targetDateStr = _isoDate.slice(0, 10);
    const firstDateStr = this.arrBody[0].time.slice(0, 10);
    const lastDateStr = this.arrBody[this.arrBody.length - 1].time.slice(0, 10);
    if (_targetDateStr < firstDateStr) {
      const _retInfo = { ...this.arrBody[0] };
      _retInfo.id     = -1;
      _retInfo.time   = _isoDate;
      return _retInfo;
    } else if (lastDateStr < _targetDateStr) {
      const _retInfo = { ...this.arrBody[this.arrBody.length-1] };
      _retInfo.id     = -1;
      _retInfo.time   = _isoDate;
      return _retInfo;
    } else {
      const _index = this.arrBody.findIndex(b => b.time?.slice(0, 10) === _targetDateStr);
      if (_index < 0 ){
        const targetMs          = Date.parse(_isoDate);
        const afterIndex        = this.arrBody.findIndex(b => Date.parse(b.time) > targetMs);
        const beforeData        = this.arrBody[afterIndex - 1]; // 直前の過去データ
        const afterData         = this.arrBody[afterIndex];     // 直後の未来データ
        const beforeMs          = Date.parse(beforeData.time);
        const afterMs           = Date.parse(afterData.time);
        const totalDuration     = afterMs - beforeMs;
        const currentDuration   = targetMs - beforeMs;
        const ratio             = totalDuration > 0 ? currentDuration / totalDuration : 0;
        const _retInfo          = { ...beforeData };
        _retInfo.id = -1;
        _retInfo.time = _isoDate;
        if (beforeData.height !== undefined && afterData.height !== undefined) {
          _retInfo.height = beforeData.height + (afterData.height - beforeData.height) * ratio;
        }
        if (beforeData.weight !== undefined && afterData.weight !== undefined) {
          _retInfo.weight = beforeData.weight + (afterData.weight - beforeData.weight) * ratio;
        }
        if (beforeData.fatRate !== undefined && afterData.fatRate !== undefined) {
          _retInfo.fatRate = beforeData.fatRate + (afterData.fatRate - beforeData.fatRate) * ratio;
        }
        return _retInfo;
      } else {
        const _retInfo = { ...this.arrBody[_index] };
        _retInfo.time   = _isoDate;
        return _retInfo;
      }
    }
  }
  public bloodInfo(  _isoDate:string ): IBlood {
    if (this.arrBlood.length === 0){
      const _retInfo = new Blood(-1,_isoDate);
      return _retInfo;
    }
    const _targetDateStr = _isoDate.slice(0, 10);
    let _retInfo    = this.arrBlood[0];
    for ( let b of this.arrBlood){
      if ( _targetDateStr < b.time.slice(0, 10)){
        break;
      }
      _retInfo    = b;
    }
    _retInfo = { ..._retInfo };
    return _retInfo;
  }
  public bodyFactorInfo(): IBodyFactor {
    return { ...this.bodyFactor };
  }
  //===========================================================================
  public bloodAlcohol(alcohol:number, bodyInfo:IBody): {widmarkBac:number, fatRateBac:number }{

    const density             = this.densityBac(bodyInfo);
    const widmarkBac:number   = alcohol / ( bodyInfo.weight * density.widmark ) / 10;
    const fatRateBac:number   = alcohol / ( bodyInfo.weight * density.fatRate ) / 10;

    return { widmarkBac:widmarkBac, fatRateBac:fatRateBac}
  }
  public strBloodAlcohol(alcohol:number, _isoDate:string): {val100:number, text:string, level:string, bgColor:string, textColor:string}{
    //    const _density = this.isMale ? 0.7 : 0.6;
    const _bal:number  = Num.float( this.bloodAlcohol(alcohol, this.bodyInfo(_isoDate)).widmarkBac , APP_CONFIG.DEC_PLACE_IDX);
    let _index:number = 0;
    for ( let balc of HealthService.BLOOD_ALCOHOL){
      if (  _bal < balc.limit){
        break;
      }
      _index++;
    }
    const _balc             = HealthService.BLOOD_ALCOHOL[_index];
    const _textColor:string = Color.textColor(_balc.color)
    return {  val100:     _bal,
              text:       Str.float(_bal, APP_CONFIG.DEC_PLACE_IDX, APP_CONFIG.DEC_PLACE_IDX )  + '%',
              level:      _balc.name,
              bgColor:    _balc.color,
              textColor:  _textColor,
    }
  }
  private densityBac( bodyInfo:IBody ): { widmark:number, fatRate:number}{
    // 体脂肪率を組み込んで血中アルコール濃度（BAC）を精密に計算する場合、
    // 法医学や警察の捜査でも世界基準として使われている
    // 「ヴィドマーク法（Widmark Formula）」の応用がベースになります。
    //
    // 体内アルコール拡散係数（r値）を体脂肪率から計算する(男女差あり)
    const genderCoef:number   = this.bodyFactor.gender === 'male' ? 0.82 : 0.73
    const rFactor:number      = genderCoef - (0.0075 * bodyInfo.fatRate*100);
    //---
    // 除脂肪体重
    const _density            = 0.91 * ( 1 - bodyInfo.fatRate);

    return {widmark:rFactor, fatRate: _density}
  }
  public widmarkBacToAlcohol(widmarkBac:number, bodyInfo:IBody ):number {
    const density:number  = this.densityBac(bodyInfo).widmark;
    return widmarkBac * ( bodyInfo.weight * density ) * 10;
  }
  public fatRateBacToAlcohol(fatRateBac:number, bodyInfo:IBody ):number {
    const density:number  = this.densityBac(bodyInfo).fatRate;
    return fatRateBac * ( bodyInfo.weight * density ) * 10;
  }
  public makeDrinkChartYLineSetting(_alMax:number, _isoDate:string ){
    const numSafeLimit:number = 20;
    const safeLimit = {
      yValue: 20, 
      labelText: '適量:20g', 
      color: '#178a00'
    }
    if (_alMax < numSafeLimit ){
      return [ safeLimit ];
    } else {
      const _bodyInfo     = this.bodyInfo(_isoDate);
      const defMaxIdx     = HealthService.BLOOD_ALCOHOL.length-1;
      for ( let i = 0; i < HealthService.BLOOD_ALCOHOL.length; i++){
        const _limit      = HealthService.BLOOD_ALCOHOL[i].limit - 0.005;
        const alcohol     = Num.float( this.widmarkBacToAlcohol(_limit, _bodyInfo),APP_CONFIG.DEC_PLACE_DEF );          
        if (_alMax < alcohol || i === defMaxIdx){
          const bac       = HealthService.BLOOD_ALCOHOL[i];
          return [ safeLimit, { yValue:alcohol,labelText:bac.name, color:bac.color } ];
        }
      }
      return [ safeLimit ];
    }
  }
  public waterForAlcohol( alcohol:number, ml:number){
    //----------------
    // アルコールには強い利尿作用があり、
    // 「純アルコール1gにつき、約10ml〜11mlの水が尿として余分に排出される」
    //
    //「お酒自体の水分の半分（が素通りして消える）＋アルコールの利尿作用による脱水分」
    //  private static readonly WATER_PER_ALCOHOL_G:number  =    11;
    //return alcohol* HealthService.WATER_PER_ALCOHOL_G + ml /2;

    //----------------
    // 純アルコール1gあたり、体から直接失われる水分は 「14ml」 でした。
    // アルコールの分解に消費される水 ＝ 4ml
    // アルコールの 利尿作用 で絞り出される水 ＝ 10ml 
    // ★この時点で、14mlのうち 「10ml（約71%）」が利尿作用によるものです。
    // そして、これまでの議論の通り、アルコールが体内にあるうちは
    // 「水分保持率が25%」まで低下して水が漏れてしまうため、時間差の復活を見越して
    //  2倍（前半と後半を均した現実的な補正） の掛け算を公式に組み込んでいました。

    // ユーザーに提示する水の量 ＝ (純アルコールg × 28) － お酒の量
    // そのうち 利尿作用に対抗するための水の量 ＝ 純アルコールg × 20
    // そのうち 分解に消費される水の量 ＝ 純アルコールg × 8

    const _water  = alcohol * 28 - ml;
    return _water > 0 ? _water : 0
  }
  public rateAlcMetabolic(_startTime:string){

    const bodyInfo                = this.bodyInfo(_startTime);
    const lean_body_mass          = bodyInfo.weight * ( 1 - bodyInfo.fatRate);
    //----
    let rateAlcToleranceFactor    = HealthService.ALC_TOLERANCE[this.bodyFactor.alcToleranceLevel].factor;
    //----
    // 海外の法医学などで使われる基準（ヴィドマーク法などの応用）をベースにすると、
    // 除脂肪体重1kgあたり約 0.13g〜0.15gのアルコールを1時間に分解できるとされています。
    // ここでは安全を考慮して「0.13g」で計算します。
    //
    // その上で、アルコール代謝では少なめの数値の出る「除脂肪体重ベース」を使う
    return lean_body_mass * 0.13 * rateAlcToleranceFactor;
  }
  public alcToleranceInfo( level: AlcToleranceLevel):IAlcToleranceInfo{
    return HealthService.ALC_TOLERANCE[level];
  }
  public static get alcToleranceList(): IAlcToleranceListItem[] {
    return Object.entries(HealthService.ALC_TOLERANCE).map(([key, value]) => ({
      level: key as AlcToleranceLevel,
      ...value
    }));
  }
  public alcClearanceTime( _alcohol:number, _hourSleep:number, _startTime:string): {time:string, min:number}{
    const safetyFactor = 0.8;
    const _baseClearMin:number    = _alcohol / (this.rateAlcMetabolic(_startTime)*safetyFactor) * 60;
    //--
    let maxSleepClearMin  = _baseClearMin * 2;
    let sleepMin          = _hourSleep * 60;
    let _clearMin:number  = 0;
    if (maxSleepClearMin <= sleepMin) {
      _clearMin = maxSleepClearMin;
    } else {
      _clearMin = _baseClearMin + (sleepMin / 2);
    }
    const _clearMs          = this.dateSvc.isoToUtcDate(_startTime).getTime() + _clearMin * 60 * 1000;
    const _clearTime:string = this.dateSvc.utcDateToIso(new Date(_clearMs));
    return {time:_clearTime, min:_clearMin}
  }
  //===========================================================================
  public deleteBodyInfo(_bodyId:number){
    this.arrBody                = this.arrBody.filter(body => body.id !== _bodyId);
    this.arrBody                = Util.sortAndResetIds(this.arrBody);
    localStorage['arrBody']     = JSON.stringify(this.arrBody);    
  }
  public deleteBloodInfo(_bloodId:number){
    this.arrBlood               = this.arrBlood.filter(blood => blood.id !== _bloodId);
    this.arrBlood               = Util.sortAndResetIds(this.arrBlood);
    localStorage['arrBlood']    = JSON.stringify(this.arrBlood);    
  }  
  //===========================================================================
  public colorGgtp(_val:number): {bgColor:string, textColor:string}{
    let _bgColor  = 'var(--ion-text-color)';
    if ( 51 <= _val && _val < 100){
      _bgColor    = '#ffA000';
    } else if ( 100 <= _val && _val < 200){
      _bgColor    = '#ff6000';
    } else if ( 200 <= _val ){
      _bgColor    = '#ff0000';
    }
    const _textColor:string = Color.textColor(_bgColor)
    return {bgColor:_bgColor, textColor:_textColor}
  }
  public colorAst(_val:number): {bgColor:string, textColor:string}{
    return this.colorAstAlt(_val);
  }
  public colorAlt(_val:number): {bgColor:string, textColor:string}{
    return this.colorAstAlt(_val);
  }
  private colorAstAlt(_val:number): {bgColor:string, textColor:string}{
    let _bgColor  = 'var(--ion-text-color)';
    if ( 31 <= _val && _val < 50){
      _bgColor    = '#ff6000';
    } else if ( 50 <= _val ){
      _bgColor    = '#ff0000';
    }
    const _textColor:string = Color.textColor(_bgColor)
    return {bgColor:_bgColor, textColor:_textColor}
  }  
  //===========================================================================
}
