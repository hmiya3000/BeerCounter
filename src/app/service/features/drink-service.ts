import { Injectable } from '@angular/core';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { DEF } from 'src/app/config/default-constants';
import { Drink } from '../../class/drink';
import { DateService } from '../date-service';
import { IDrink } from 'src/app/interface/drink';
import { Color, Num, Str, Util } from 'src/app/utils/util';
import { HealthService } from './health-service';
import { Blood, Body } from 'src/app/class/health';
import { AlcToleranceLevel, GenderType, IBodyFactor } from 'src/app/interface/health';
import { IndicatorData } from '../chart-service';


export interface ITipsBloodAlcohol {
  name:         string;
  bac100:       string;
  bgColor:      string;
  textColor:    string;
  explain:      string;
}
export interface IDisplayDrink {
  id:             number;
  time:           string;
  name:           string;
  glass:          string;
  displayTime:    string;       // strHM(d.time) の結果を入れる
  displayDateHM:  string;       // strDateHM(d.time) の結果
  alContent:      string;       // strDrinkAlContent(d) の結果を入れる
  ml:             string;       // strDrinkMl(d) の結果を入れる
  coef:           string;       // strDrinkCoef(d) の結果を入れる
  alcoholText:    string;       // strAlcohol(d) の結果を入れる
  bgColor:        string;       // colorAlcohol(d).bgColor の結果を入れる
  textColor:      string;       // colorAlcohol(d).textColor の結果を入れる
  raw:            any;          // 元のdrinkオブジェクト（必要に応じて）
}
//===========================================================================
@Injectable({
  providedIn: 'root',
})
export class DrinkService {

  public  arrDrink:IDrink[]                           = [];

  private lastDrinkId:number                          = -1;
  public  heightMug:number                            = DEF.HEIGHT_MUG;
  public  arrTipsBloodAlcohol:ITipsBloodAlcohol[]     = [];
  public  arrIndicatorBloodAlcohol:IndicatorData[]    = [];
//===========================================================================
  constructor(
    private dateSvc: DateService,
    private healthSvc: HealthService,
  ){
  }
  //===========================================================================
  public async initialize(){

    this.cleanRecord();
    for ( let i = 1; i < HealthService.BLOOD_ALCOHOL.length; i++ ){
      this.arrTipsBloodAlcohol.push(
        { name:       HealthService.BLOOD_ALCOHOL[i].name,
          bac100:     HealthService.BLOOD_ALCOHOL[i-1].limit + '%〜',
          bgColor:    HealthService.BLOOD_ALCOHOL[i].color,
          textColor:  Color.textColor(HealthService.BLOOD_ALCOHOL[i].color) ,
          explain:    HealthService.BLOOD_ALCOHOL[i].explain
        }
      )
    }
    for ( let bac of HealthService.BLOOD_ALCOHOL){
      this.arrIndicatorBloodAlcohol.push( {value:bac.limit, bgColor:bac.color })
    }
  }
  public readBackup(){
    localStorage.removeItem('arrParty');  //後で消す
    if ('arrDrink' in localStorage){
      this.arrDrink         = JSON.parse(localStorage['arrDrink']);
    }
    if ('heightMug' in localStorage){
      this.heightMug        = JSON.parse(localStorage['heightMug']);
    }
    //---
    this.arrDrink   = Util.sortAndResetIds(this.arrDrink);
    this.arrDrink = [...this.arrDrink];
    if (this.arrDrink.length === 0) {
      this.lastDrinkId = -1;
    } else {
      this.lastDrinkId = this.arrDrink[this.arrDrink.length - 1].id;
    }
  }
  public clearBackup(){
    localStorage.removeItem('heightMug');
    this.heightMug  = DEF.HEIGHT_MUG;
  }
  public clearBackupDebug(){
    this.clearBackup();
    localStorage.removeItem('arrDrink');
    this.arrDrink = []
    this.lastDrinkId = -1;
  }
  //===========================================================================
  public bodyInfo( _isoDate:string ): { weight:number, fatRate:number}{
    const _bodyInfo       = this.healthSvc.bodyInfo(_isoDate);
    return { weight:_bodyInfo.weight, fatRate:_bodyInfo.fatRate}
  }
  public bloodInfo( _isoDate:string ): { ggtp:number, astgot:number, altgpt:number }{
    const _info = this.healthSvc.bloodInfo(_isoDate);
    return { ggtp:_info.ggtp, astgot:_info.astgot, altgpt:_info.altgpt}
  }
  public deleteBodyInfo(_bodyId:number){
    this.healthSvc.deleteBodyInfo(_bodyId);
  }
  public deleteBloodInfo(_bloodId:number){
    this.healthSvc.deleteBloodInfo(_bloodId);
  }
  public get lastDrink(): IDrink {
    return this.arrDrink[this.arrDrink.length-1];
  }
  public curDrink( _id:number): IDrink {
    const _curDrink = this.arrDrink.find(d =>  d.id === _id);
    if (_curDrink == null){
      return new Drink();
    } else {
      return _curDrink;
    }
  }
  public isValidYearMonth( _year:number, _month:number): boolean {
    if (this.arrDrink.length === 0){
      return false;
    }
    const firstDrinkDate:Date = this.dateSvc.isoToUtcDate(this.arrDrink[0].time);
    if (_year < firstDrinkDate.getFullYear()){
      return false;
    } else if (_year === firstDrinkDate.getFullYear()){
      if (_month <  firstDrinkDate.getMonth() +1){
        return false;
      }
    }
    const nowDate  = this.dateSvc.nowDate()
    if (nowDate.year < _year ){
      return false;
    } else if (_year === nowDate.year){
      if ( nowDate.month < _month ){
        return false;
      }
    }
    return true;
  }
  public strXXXXPlaceholder(_utcDate:Date){
    return _utcDate.getHours().toString().padStart(2,'0') +  _utcDate.getMinutes().toString().padStart(2,'0'); 
  }
  public strXXXXMessage(_utcDate:Date, _is12hour:boolean){
    const retVal        = this._getOffsetTimes(_utcDate);
    let   _message      = '';
    if (_is12hour){
      _message   = `4桁の数字で入力します (${this._strDayHM(retVal.minus12)}〜${this._strDayHM(retVal.plus12)})`;
    } else {
      _message   = `4桁の数字で入力します (0000 〜 2359)`;
    }
    return _message
  }
  private _strDayHM( _date:Date){
    return _date.getMonth()+1 + '/' + _date.getDate().toString() + ' ' + _date.getHours().toString().padStart(2,'0') +  _date.getMinutes().toString().padStart(2,'0');
  }
  private _getOffsetTimes(_utcDate: Date | string) {
    const baseDate = new Date(_utcDate);
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const minus12Date = new Date(baseDate.getTime() - twelveHoursInMs + 1 * 60 * 1000);
    const plus12Date  = new Date(baseDate.getTime() + twelveHoursInMs);
    return {
      minus12: minus12Date,
      plus12:  plus12Date,
    };
  }
  public bodyFactorInfo(): IBodyFactor{
    return this.healthSvc.bodyFactorInfo();
  }
  public setBodyFactorInfo( gender:GenderType, alcToleranceLevel:AlcToleranceLevel){
    const _curInfo = this.healthSvc.bodyFactorInfo();
    _curInfo.gender             = gender
    _curInfo.alcToleranceLevel  = alcToleranceLevel;
    this.healthSvc.setBodyFactorInfo(_curInfo);
  }
  //===========================================================================
  public calcAlcohol( content:number, ml:number, coef:number){
    return Num.float(content * ml * coef * 0.8, APP_CONFIG.DEC_PLACE_DEF);
  }
  public calcAlcoholUnit( _alcoholG:number){
    return  Num.float(_alcoholG / 0.8 / 0.05 / 500,  APP_CONFIG.DEC_PLACE_DEF);
  }
  public strAlcohol(drink:IDrink): string {
    return this.calcAlcohol( drink.alContent, drink.ml, drink.coef) + 'g';
  }
  public setBodyInfo( _isoDate:string, _weight:number, _fatRate:number){
    const _bodyInfo = new Body(-1,_isoDate, 170, _weight, _fatRate);
    this.healthSvc.setBodyInfo(_bodyInfo);
  }
  public setBloodInfo( _isoDate:string, _ggtp:number, _astgot:number, _altgpt:number ){

    const _bloodInfo = new Blood(-1,_isoDate, _ggtp, _astgot, _altgpt );
    this.healthSvc.setBloodInfo(_bloodInfo);
  }
  public colorAlcLevel( _alContent:number): {bgColor:string, textColor:string}{
    let _bgColor:string = '#FFFFFF'
    if (_alContent <= 0.01){
      _bgColor =  '#3cd3f2'
    } else if (_alContent <= 5){
      _bgColor =  '#ffb703'
    } else if  (_alContent <= 10){
      _bgColor =  '#fb8500'
    } else if  (_alContent <= 15){
      _bgColor =  '#ff4d00'
    } else {
      _bgColor =  '#d90429'
    }
    const _textColor:string = Color.textColor(_bgColor)
    return {bgColor:_bgColor, textColor:_textColor}
  }
  //===========================================================================
  public async addDrink( _name:string, _glass:string, _content:number, _ml:number, _coef:number, _nowDate:Date) {
    this.lastDrinkId++;
    let _newDrink = new  Drink( _name, _glass, _ml, _content, _coef, _nowDate.toISOString(), this.lastDrinkId);
    this.arrDrink.push( _newDrink );
  }
  public deleteDrink(drinkId:number){
    this.arrDrink               = this.arrDrink.filter(drink => drink.id !== drinkId);
  }
  public sortArrDrink(){
    this.arrDrink   = Util.sortAndResetIds(this.arrDrink);
    this.arrDrink = [...this.arrDrink];
    localStorage['arrDrink'] = JSON.stringify(this.arrDrink);
    return this.arrDrink;
  }
  public changeHHMM( _newHHMM:string, _baseTime:string, is12hour:boolean = false ): string{
    if (_newHHMM.trim() !== ""){
      let _numHHMM = Number(_newHHMM.trim());
      if (!isNaN(_numHHMM) && _numHHMM <= 2359 && _numHHMM >= 0){
        if (this.arrDrink !== null ){
          const _hh:number = Math.floor(_numHHMM / 100);
          const _mmTmp:number = _numHHMM - _hh * 100;
          const _mm:number    = _mmTmp > 59 ? 59 : _mmTmp;
          const _orgDate:Date = this.dateSvc.isoToUtcDate(_baseTime);
          const _tmpDate:Date = this.dateSvc.setHmsToUtcDate( _orgDate, _hh,_mm);
          //---
          const diffInMilliseconds  = _orgDate.getTime() - _tmpDate.getTime();
          const diffInMinutes       = Math.floor(diffInMilliseconds / (1000  * 60));
          const resultDateB         = new Date(_tmpDate);
          if (diffInMinutes >= 12*60){
            resultDateB.setDate(resultDateB.getDate() + 1);
          } else if (diffInMinutes <= -12*60 - 1){
            resultDateB.setDate(resultDateB.getDate() - 1);
          } 
          return this.dateSvc.utcDateToIso( resultDateB );
        }
      }
    }
    return '';
  }
  //===========================================================================
  public makeDrinkChartData( _arrDrink:IDrink[] ): { time:string[], alcohol:number[], alcoholMax:number}{
    let _time:string[]        = [];
    let _alcohol:number[]     = [];
    let _alMax:number         = 0;
    let _alSum:number         = 0;
    for ( let d of _arrDrink){
      _time.push(  this.dateSvc.isoToStrHM(d.time) );
      const _al = this.calcAlcohol(d.alContent, d.ml, d.coef);
      _alSum  = _alSum + _al;
      _alcohol.push( _alSum );
      if (_alMax < _alSum){
        _alMax  = _alSum
      }
    }
    return {  time:_time, alcohol:_alcohol, alcoholMax:_alMax }
  }
  //---
  public setHeightMug( _heightMug:number){
    this.heightMug  = _heightMug;
    localStorage['heightMug']    = JSON.stringify(this.heightMug);
  }
  //===========================================================================
  public convertToDisplayArrDrink( arrDrink: IDrink[], isReverse:boolean): IDisplayDrink[] {
    if (!arrDrink) return [];
    const calculatedArrDrink = arrDrink.map(d => {
      const color = this.colorAlcohol(d); // 既存のメソッド
      return {
        id:             d.id,
        time:           d.time,
        name:           d.name,
        glass:          d.glass,
        displayTime:    this.dateSvc.isoToStrHM(d.time),
        displayDateHM:  this.dateSvc.isoToStrDateHM(d.time,true,true),
        alContent:      this.strDrinkAlContent(d),
        ml:             this.strDrinkMl(d),
        coef:           this.strDrinkCoef(d),
        alcoholText:    this.strAlcohol(d),
        bgColor:        color.bgColor,
        textColor:      color.textColor,
        raw: d
      };
    });
    if (isReverse){
      return calculatedArrDrink.reverse();
    } else {
      return calculatedArrDrink;
    }
  }
  private strDrinkAlContent(_drink:IDrink): string {
    return Str.float(_drink.alContent*100, APP_CONFIG.DEC_PLACE_DEF ) + '度';
  }
  private strDrinkMl(_drink:IDrink): string {
    return Str.float(_drink.ml, APP_CONFIG.DEC_PLACE_DEF ) + 'ml';
  }
  private strDrinkCoef(_drink:IDrink): string {
    return Str.ratePct(_drink.coef, APP_CONFIG.DEC_PLACE_DEF );
  }
  private colorAlcohol( _drink:IDrink): { bgColor:string, textColor:string} {
    const _alc:number = this.calcAlcohol(_drink.alContent, _drink.ml, _drink.coef);
    return this.colorAlcLevel(_alc);
  }
  public  makeArrDrinkNoDuplicate( arrDrink: IDrink[]): IDrink[]{
    const uniqueDrinks = Array.from(
      new Map(
        arrDrink.map(drink => {
          // 5つのプロパティを組み合わせたユニークなキーを作成
          const key = `${drink.name}_${drink.glass}_${drink.ml}_${drink.alContent}_${drink.coef}`;
          return [key, drink];
        })
      ).values()
    ).sort((a, b) => a.id - b.id);
    return uniqueDrinks;
  }
  //===========================================================================
  private cleanRecord(){
    if ('arrDrink' in localStorage){
      this.arrDrink         = JSON.parse(localStorage['arrDrink']);
    }
    for ( let d of this.arrDrink){
      if (d.glass === '中スリム'){
        if (d.ml === 320){
//          d.ml  = 280
//          d.coef  = 0.8
        }
      }
    }
    this.arrDrink   = Util.sortAndResetIds(this.arrDrink);
    this.arrDrink = [...this.arrDrink];
    localStorage['arrDrink']    = JSON.stringify(this.arrDrink);
    //---
  }
  //===========================================================================
}