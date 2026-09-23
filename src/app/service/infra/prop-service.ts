import { Injectable } from '@angular/core';
//---
import { DateService } from './date-service';
import { InputService } from './input-service';
import { Str } from 'src/app/utils/util';
//---
import { APP_CONFIG } from 'src/app/config/app.constants';
import { ILand, IHouse } from 'src/app/interface/estate';
import { Land } from 'src/app/class/land';
import { House } from 'src/app/class/house';
import { Estate } from 'src/app/class/estate';
//---
@Injectable({
  providedIn: 'root'
})
export class PropService {

  private static readonly ASSESS_MIN:number  = 1;      //山奥や過疎地、車が通れない私道などでは、1㎡あたり数千円〜数万円の路線価が設定されている場所が無数に存在します
  private static readonly ASSESS_MAX:number  = 60000;  //最新価格（2026年）：1㎡あたり 5,336万円

  private land!: ILand;
  private house!:IHouse;
  //---
  public  roadrateCurr:number             = 0;
  public  replaceCostCurr:number          = 0;
  //---
  public  landPricePropCurr:number        = 0;
  public  landPricePropBaseCurr:number    = 0;
  public  landPriceTownBaseCurr:number    = 0;
  //---
  private landPriceMarketCurr:number      = 0;
  private landPriceInheritCurr:number     = 0;
  //---
  public  housePricePropCurr:number       = 0;
  private termPropMin:number              = 0;
  private termPropMax:number              = 0;
  private termPropCurr:number             = 0;
  public  rangeProp:number                = 0;
  //===========================================================================
  constructor(
    private dateSvc: DateService,
    private inputSvc: InputService,
  ) { }
  //===========================================================================
  public initParam( _land:ILand, _house:IHouse){
    this.land                     = _land;
    this.house                    = _house;
    //---
    this.termPropMin              = _house.termAcqu -12;
    this.termPropMax              = this.dateSvc.nowDate().term + 24;
    this.termPropCurr             = _house.termAcqu;
    this.roadrateCurr             = this.land.roadrate;
    this.replaceCostCurr          = this.house.replacementCost;
    const _landPriceProp:number   = this.landPricePropFromRoadrate(this.roadrateCurr,this.land.area);
    const _housePriceProp:number  = House.calcPriceProp(this.termPropCurr,this.house.termBuild,this.house.termAcqu,this.house.constNo,this.house.area,this.replaceCostCurr);
    this.updateParams( _landPriceProp, _housePriceProp);
  }
  public setDefaultReplaceCost(){
    this.replaceCostCurr          = House.arrConstruct[this.house.constNo].replacementCost;
    const _housePriceProp:number  = House.calcPriceProp(this.termPropCurr,this.house.termBuild,this.house.termAcqu,this.house.constNo,this.house.area,this.replaceCostCurr);
    this.updateParams( this.landPricePropCurr, _housePriceProp);
  }
  public setParam(){
    this.land.priceProp         = this.landPricePropCurr;
    this.land.roadrate          = this.roadrateCurr;  
    this.land.priceInherit      = this.landPriceInheritCurr;
    this.land.priceMarket       = this.landPriceMarketCurr;
    this.house.priceProp0       = this.housePricePropCurr;
    this.house.replacementCost  = this.replaceCostCurr;
  }
  //===========================================================================
  strCurrYear(){
    return this.dateSvc.termToYear(this.termPropCurr) + "年";
  }
  public get strLandArea() : string {
    return Str.float(this.land.area, APP_CONFIG.DEC_PLACE_AREA ) + '㎡';
  }
  public get strHouseArea() : string {
    return Str.float(this.house.area, APP_CONFIG.DEC_PLACE_AREA) + '㎡';
  }  
  //---土地価格
  public get strLandPrice() : { yen:string, manYen:string } {
    return {
      yen:    this.land.price.toLocaleString() + '円',
      manYen: Str.priceManYen(this.land.price, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strLandPriceInherit() : { yen:string, manYen:string } {
    return {
      yen:    this.landPriceInheritCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.landPriceInheritCurr, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strLandPriceMarket() : { yen:string, manYen:string } {
    return {
      yen:    this.landPriceMarketCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.landPriceMarketCurr, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strLandPriceBook0() : { yen:string, manYen:string } {
    return {
      yen:    this.land.priceBook.toLocaleString() + '円',
      manYen: Str.priceManYen(this.land.priceBook, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---建物価格
  public get strHousePrice() : { yen:string, manYen:string } {
    return {
      yen:    this.house.price.toLocaleString() + '円',
      manYen: Str.priceManYen(this.house.price, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePriceFrame() : { yen:string, manYen:string } {
    const _housePriceFrame:number =  Math.floor(this.house.price * (1 - this.house.ratioEquip))
    return {
      yen:    _housePriceFrame.toLocaleString() + '円',
      manYen: Str.priceManYen(_housePriceFrame, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePriceEquip() : { yen:string, manYen:string } {
    const _housePriceEquip:number =  Math.floor(this.house.price * this.house.ratioEquip);
    return {
      yen:    _housePriceEquip.toLocaleString() + '円',
      manYen: Str.priceManYen(_housePriceEquip, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---土地建物:簿価
  public get strHousePriceBook0() : { yen:string, manYen:string } {
    return {
      yen:    this.house.priceBook.toLocaleString() + '円',
      manYen: Str.priceManYen(this.house.priceBook, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePriceBook0Frame() : { yen:string, manYen:string } {
    const _housePriceBookFrame  = this.house.priceBook - this.house.priceBookEquip;
    return {
      yen:    _housePriceBookFrame.toLocaleString() + '円',
      manYen: Str.priceManYen(_housePriceBookFrame, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePriceBook0Equip() : { yen:string, manYen:string } {
    return {
      yen:    this.house.priceBookEquip.toLocaleString() + '円',
      manYen: Str.priceManYen(this.house.priceBookEquip, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strPriceBook0() : { yen:string, manYen:string } {
    const _priceBook:number  = this.land.priceBook + this.house.priceBook + this.house.initReform;
    return {
      yen:    _priceBook.toLocaleString() + '円',
      manYen: Str.priceManYen(_priceBook, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strInitReformPriceBook0() : { yen:string, manYen:string } {
    return {
      yen:    this.house.initReform.toLocaleString() + '円',
      manYen: Str.priceManYen(this.house.initReform, APP_CONFIG.DEC_PLACE_DEF),
    }
  }
  //---課税標準額:固定資産税
  public get strLandPriceProp() : { yen:string, manYen:string } {
    return {
      yen:    this.landPricePropCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.landPricePropCurr, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePriceProp() : { yen:string, manYen:string } {
    return {
      yen:    this.housePricePropCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.housePricePropCurr, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---課税標準額:固定資産税
  public get strLandPricePropBase() : { yen:string, manYen:string } {
    return {
      yen:    this.landPricePropBaseCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.landPricePropBaseCurr, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHousePricePropBase() : { yen:string, manYen:string } {
    return this.strHousePriceProp;
  }
  public get strPricePropBase() : { yen:string, manYen:string } {
    const _propBase:number  = this.landPricePropBaseCurr + this.housePricePropCurr;
    return {
      yen:    _propBase.toLocaleString() + '円',
      manYen: Str.priceManYen(_propBase, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---課税標準額:都市計画税
  public get strLandPriceTownBase() : { yen:string, manYen:string } {
    return {
      yen:    this.landPriceTownBaseCurr.toLocaleString() + '円',
      manYen: Str.priceManYen(this.landPriceTownBaseCurr, APP_CONFIG.DEC_PLACE_DEF)
    } 
  }
  public get strPriceTownBase() : { yen:string, manYen:string } {
    const _townBase:number  = this.landPriceTownBaseCurr + this.housePricePropCurr;
    return {
      yen:    _townBase.toLocaleString() + '円',
      manYen: Str.priceManYen(_townBase, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---固定資産税
  public get strLandTaxProp() : { yen:string, manYen:string } {
    const _landTaxProp:number = Land.calcTaxProp( this.landPricePropCurr, this.land.area, this.house.rooms);
    return {
      yen:    _landTaxProp.toLocaleString() + '円',
      manYen: Str.priceManYen( _landTaxProp, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHouseTaxProp() : { yen:string, manYen:string } {
    const _houseTaxProp:number  = House.calcTaxProp(this.housePricePropCurr);
    return {
      yen:    _houseTaxProp.toLocaleString() + '円',
      manYen: Str.priceManYen( _houseTaxProp, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strTaxProp() : { yen:string, manYen:string } {
    const _taxProp:number = Estate.calcTaxProp( this.landPricePropCurr, this.land.area, this.housePricePropCurr, this.house.rooms);
    return {
      yen:    _taxProp.toLocaleString() + '円',
      manYen: Str.priceManYen( _taxProp, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---都市計画税
  public get strLandTaxTown() : { yen:string, manYen:string } {
    const _landTaxTown:number = Land.calcTaxTown( this.landPricePropCurr, this.land.area, this.house.rooms);
    return {
      yen:    _landTaxTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _landTaxTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHouseTaxTown() : { yen:string, manYen:string } {
    const _houseTaxTown:number  = House.calcTaxTown(this.housePricePropCurr);
    return {
      yen:    _houseTaxTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _houseTaxTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strTaxTown() : { yen:string, manYen:string } {
    const _taxTown:number = Estate.calcTaxTown( this.landPricePropCurr, this.land.area, this.housePricePropCurr, this.house.rooms);
    return {
      yen:    _taxTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _taxTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---固定資産税/都市計画税
  public get strLandTaxPropTown() : { yen:string, manYen:string } {
    const _landTaxProp:number = Land.calcTaxProp( this.landPricePropCurr, this.land.area, this.house.rooms);
    const _landTaxTown:number = Land.calcTaxTown( this.landPricePropCurr, this.land.area, this.house.rooms);
    const _landTaxPropTown:number = _landTaxProp + _landTaxTown;
    return {
      yen:    _landTaxPropTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _landTaxPropTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strHouseTaxPropTown() : { yen:string, manYen:string } {
    const _houseTaxProp:number      = House.calcTaxProp(this.housePricePropCurr);
    const _houseTaxTown:number      = House.calcTaxTown(this.housePricePropCurr);
    const _houseTaxPropTown:number  = _houseTaxProp + _houseTaxTown;
    return {
      yen:    _houseTaxPropTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _houseTaxPropTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strTaxPropTown() : { yen:string, manYen:string } {
    const _taxPropTown:number = Estate.calcTaxPropTown(this.landPricePropCurr,this.land.area,this.housePricePropCurr,this.house.rooms );
    return {
      yen:    _taxPropTown.toLocaleString() + '円',
      manYen: Str.priceManYen( _taxPropTown, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  //---不動産取得税
  public get strLandTaxAcqu() : { yen:string, manYen:string, val:number } {
    const _landTaxAcqu:number = Land.calcTaxAcqu(this.landPricePropCurr);
    return {
      yen:    _landTaxAcqu.toLocaleString() + '円',
      manYen: Str.priceManYen( _landTaxAcqu, APP_CONFIG.DEC_PLACE_DEF),
      val:    _landTaxAcqu
    }
  }
  public get strHouseTaxAcqu() : { yen:string, manYen:string, val:number } {
    const _houseTaxAcqu:number  = House.calcTaxAcqu(this.house.area,this.house.termBuild,this.house.termAcqu,this.housePricePropCurr);
    return {
      yen:    _houseTaxAcqu.toLocaleString() + '円',
      manYen: Str.priceManYen( _houseTaxAcqu, APP_CONFIG.DEC_PLACE_DEF),
      val:    _houseTaxAcqu
    }
  }
  public get strTaxAcqu() : { yen:string, manYen:string } {
    const _taxAcqu:number = this.strLandTaxAcqu.val + this.strHouseTaxAcqu.val;
    return {
      yen:    _taxAcqu.toLocaleString() + '円',
      manYen: Str.priceManYen( _taxAcqu, APP_CONFIG.DEC_PLACE_DEF),
    }
  }
  //---減価償却費
  public get strDepre(): { yen:string, manYen:string } {
    const _depre:number   = this.strDepreHouse.val + this.strDepreInitReform.val;
    return {
      yen:    _depre.toLocaleString() + '円',
      manYen: Str.priceManYen( _depre, APP_CONFIG.DEC_PLACE_DEF)
    }
  }
  public get strDepreHouse() : { yen:string, manYen:string, val:number } {
    const _depreHouse:number  = this.strDepreHouseFrame.val + this.strDepreHouseEquip.val;
    return {
      yen:    _depreHouse.toLocaleString() + '円',
      manYen: Str.priceManYen( _depreHouse, APP_CONFIG.DEC_PLACE_DEF),
      val:    _depreHouse
    }
  }
  public get strDepreHouseFrame() : { yen:string, manYen:string, val:number } {
    const _depre1Frame:number   = House.calcDepreciationFrame(0,this.house.priceBook,this.house.priceBookEquip,this.house.constNo,this.house.termBuild,this.house.termAcqu);
    return {
      yen:    _depre1Frame.toLocaleString() + '円',
      manYen: Str.priceManYen( _depre1Frame, APP_CONFIG.DEC_PLACE_DEF),
      val:    _depre1Frame
    }
  }
  public get strDepreHouseEquip() : { yen:string, manYen:string, val:number } {
    const _depre1Equip:number   = House.calcDepreciationEquip(0,this.house.priceBookEquip,this.house.termBuild,this.house.termAcqu);
    return {
      yen:    _depre1Equip.toLocaleString() + '円',
      manYen: Str.priceManYen( _depre1Equip, APP_CONFIG.DEC_PLACE_DEF),
      val:    _depre1Equip
    }
  }
  public get strDepreInitReform() : { yen:string, manYen:string, val:number } {
    const _initReformBook:number       = House.calcDepreciationRepair(0,this.house.initReform,this.house.constNo,this.house.termAcqu,this.house.termAcqu);
    return {
      yen:    _initReformBook.toLocaleString() + '円',
      manYen: Str.priceManYen(_initReformBook, APP_CONFIG.DEC_PLACE_DEF),
      val:    _initReformBook
    }
  }
  public get strRoadrate() : string {
    return this.roadrateCurr.toLocaleString() + '千円/㎡'
  }
  public get strReplaceCost() : string {
    return Str.priceManYen( this.replaceCostCurr, APP_CONFIG.DEC_PLACE_P) + '/㎡'
  }
  //===========================================================================
  public onIonInputBlur(ev:any, type:string, key:string){
    const value = ev.target!.value || '';
    if (key === "roadrateCurr"){
      //路線価
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.roadrateCurr,PropService.ASSESS_MAX,APP_CONFIG.DEC_PLACE_P );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.roadrateCurr                 = retVal.updateNum;
        const _landPriceProp:number     = this.landPricePropFromRoadrate(this.roadrateCurr,this.land.area);
        this.updateParams( _landPriceProp, this.housePricePropCurr);
      }
    } else if (key === "replaceCostCurr"){
      //再調達価格 単価
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.replaceCostCurr/10000,APP_CONFIG.PRICE_M_MAX,APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.replaceCostCurr            = retVal.updateNum *10000;
        const _housePriceProp:number    = House.calcPriceProp(this.termPropCurr,this.house.termBuild,this.house.termAcqu,this.house.constNo,this.house.area,this.replaceCostCurr);
        this.updateParams( this.landPricePropCurr, _housePriceProp);
      }
    } else if (key === "landPricePropCurr"){
      //土地:固定資産税評価額
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.landPricePropCurr/10000,APP_CONFIG.PRICE_M_MAX,APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.updateParams( retVal.updateNum *10000, this.housePricePropCurr);
        const _roadrate:number            = Land.roadrateFromPriceProp(retVal.updateNum, this.land.area);
        if (_roadrate > 0){
          this.roadrateCurr               = _roadrate;
        }
      }
    } else if (key === "landPricePropBaseCurr"){
      //土地:固定資産税,課税標準
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.landPricePropBaseCurr/10000,APP_CONFIG.PRICE_M_MAX,APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        const _tmpLandPriceProp:number  = Land.pricePropFromPricePropBase(retVal.updateNum *10000,this.land.area,this.house.rooms);
        this.roadrateCurr               = Land.roadrateFromPriceProp(_tmpLandPriceProp, this.land.area);
        const _landPriceProp:number     = this.landPricePropFromRoadrate(this.roadrateCurr,this.land.area);
        this.updateParams( _landPriceProp, this.housePricePropCurr);
      }
    } else if (key === "landPriceTownBaseCurr"){
      //土地:都市計画税,課税標準
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.landPriceTownBaseCurr/10000,APP_CONFIG.PRICE_M_MAX,APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        const _tmpLandPriceProp:number  = Land.pricePropFromPriceTownBase(retVal.updateNum *10000,this.land.area,this.house.rooms);
        this.roadrateCurr               = Land.roadrateFromPriceProp(_tmpLandPriceProp, this.land.area);
        const _landPriceProp:number     = this.landPricePropFromRoadrate(this.roadrateCurr,this.land.area);
        this.updateParams( _landPriceProp, this.housePricePropCurr);
      }
    } else if (key === "housePricePropCurr"){
      //建物:固定資産税評価額
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.housePricePropCurr/10000,APP_CONFIG.PRICE_M_MAX,APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.updateParams( this.landPricePropCurr, retVal.updateNum *10000);
        this.replaceCostCurr            = House.replacmentCostFromPriceProp(this.termPropCurr,this.house.termBuild,this.house.termAcqu,this.house.constNo,this.house.area,retVal.updateNum);
      }
    }
  }
  //===========================================================================
  public onIonRange(event: CustomEvent, mode:string){
    if (mode == "ionInput"){
      this.termPropCurr = Math.round(this.termPropMin + (this.termPropMax - this.termPropMin) * ( event.detail.value / 1200));
    } else if (mode == "ionChange"){
      //決定時
      this.termPropCurr = Math.round(this.termPropMin + (this.termPropMax - this.termPropMin) * ( event.detail.value / 1200));
      const _housePriceProp:number  = House.calcPriceProp(this.termPropCurr,this.house.termBuild,this.house.termAcqu,this.house.constNo,this.house.area,this.replaceCostCurr);
      this.updateParams( this.landPricePropCurr, _housePriceProp);
    }
  }
  //===========================================================================
  private landPricePropFromRoadrate(_roadrate:number, _landArea:number){
    this.landPriceInheritCurr   = Math.round( _roadrate * 1000 * _landArea);
    this.landPriceMarketCurr    = Math.round(this.landPriceInheritCurr / 0.8);
    const _priceProp:number     = Math.round(this.landPriceMarketCurr * 0.7);
    return _priceProp;
  }
  private updateParams( _landPriceProp:number, _housePriceProp:number){
    this.landPricePropCurr      = _landPriceProp;
    this.housePricePropCurr     = _housePriceProp;

    this.landPricePropBaseCurr  = Land.calcPropBase( this.landPricePropCurr,this.land.area,this.house.rooms);
    this.landPriceTownBaseCurr  = Land.calcTownBase( this.landPricePropCurr,this.land.area,this.house.rooms);
  }
  //===========================================================================
}
