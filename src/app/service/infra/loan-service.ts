import { Injectable } from '@angular/core';
import { ILoan } from 'src/app/interface/loan'
import { FinanceService } from './finance-service';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  public static readonly RATEP_DEC_PLACE:number = 3;  //小数点以下第3位まで
  public static readonly STR_SPACE:number       = 2; //返済表の項目間の空白文字数

  public activeLoan!: ILoan; 

  private name:string           = "";
  private startYear:number      = 0;
  private startMonth:number     = 0;

  private arrMonth:string[]     = [];
  private arrPmt:number[]       = [];
  private arrPpmt:number[]      = [];
  private arrIpmt:number[]      = [];
  private arrLb:number[]        = [];
  private payStartMonth:number  = 0;
  //---
  private place:number          = 1;
  private decPlace:number       = 1;

  constructor(
    private financeSvc: FinanceService,
  ){
    this.decPlace = LoanService.RATEP_DEC_PLACE;
    this.place    = 1;
    for ( let i = 0; i< this.decPlace; i++){
      this.place = this.place * 10;
    }
  }

  //===========================================================================
  public setActiveLoanRef(_loanRef: ILoan, _name: string, _startYear: number, _startMonth: number) {
    this.activeLoan = _loanRef; // 👈 参照渡しでメモリの住所を完全に共有！
    this.name = _name;
    this.startYear = _startYear;
    this.startMonth = _startMonth;
    this.payStartMonth = _startMonth;

    // 住所を受け取った瞬間に、最速でそのローンの返済計画を計算
    this.refreshCalculation();
  }
  //===========================================================================
  public updateLoanBorrow(lb: number, onSaveCallback: () => void) {
    this.activeLoan.loanBorrow = lb; // 住所を直接書き換えるため、BookService側の配列の中身も自動で書き換わります！
    this.refreshCalculation();
    onSaveCallback(); // BookService 側に localStorage へのセーブを要求するコールバック
  }
  public updateRateYear(ry: number, onSaveCallback: () => void) {
    this.activeLoan.rateYear = ry; // 参照先の金利をダイレクト書き換え
    this.refreshCalculation();
    onSaveCallback();
  }
  public updatePayCount(pc: number, onSaveCallback: () => void) {
    this.activeLoan.payCount = pc; // 参照先の返済回数をダイレクト書き換え
    this.refreshCalculation();
    onSaveCallback();
  }
  public updateLevelPayment(lp: boolean, onSaveCallback: () => void) {
    this.activeLoan.levelPayment = lp;
    this.refreshCalculation();
    onSaveCallback();
  }
  public refreshCalculation() {
    if (this.activeLoan) {
      this.calcAll(this.activeLoan); // 自身の activeLoan を使って 1円単位のシミュレーションを実行
    }
  }
  //===========================================================================
  public setName(_name:string){
    this.name = _name;
  }
  public setStartYearMonth( _startYear:number, _startMonth:number){
    this.startYear   = _startYear;
    this.startMonth  = _startMonth;
  }
  public getStartYearMonth() : {startYear:number, startMonth:number}{
    return { startYear:this.startYear, startMonth:this.startMonth };
  }
  public strRateYear(rateYear:number){
    if (!rateYear && rateYear !== 0) return '0.000%';
    const percentValue = rateYear * 100;
    const truncated = Math.floor(percentValue * this.place + 1e-9) / this.place;
    return truncated.toFixed(this.decPlace) + '%';
  }
  public strLoanPattern(levelPayment:boolean){
    let str = ""
    if (levelPayment){
      str = "元利均等"
    } else {
      str = "元金均等"
    }
    return str;
  }
  public strStartMonth(): string {
    return this.startYear + '年' + this.startMonth + '月';
  }  
  //===========================================================================
  public strPaymentTitle(strLenMin:number){
    return this._strPaymentTitle(strLenMin, false);
  }
  public strPaymentTitleWide(strLenMin:number){
    return this._strPaymentTitle(strLenMin, true);
  }
  private _strPaymentTitle(strLenMin:number, _isWide:boolean){
    const lenMax      = this.getLenMax();
    const spc:string  = ' '.repeat(LoanService.STR_SPACE);
    const lenWord     = 4;
    const lenMin      = Math.max( strLenMin - lenWord, 1);
    if (_isWide){
      const len1st = Math.max(lenMax.pmt-lenWord,lenMin);
      return   '年月 '  + ' '.repeat(len1st) + '返済' + spc + ' '.repeat(Math.max((lenMax.ppmt-lenWord),lenMin)) + '元金' + spc + ' '.repeat(Math.max((lenMax.ipmt-lenWord),lenMin)) +'利息' + spc + ' '.repeat(Math.max((lenMax.bor-lenWord),lenMin)) + '残高' 
    } else {
      if ( this.activeLoan.levelPayment){
        const len1st = Math.max(lenMax.ppmt-lenWord, lenMin);
        return '年月 '  + ' '.repeat(len1st) + '元金' + spc + ' '.repeat(Math.max((lenMax.ipmt-lenWord),lenMin)) + '利息' + spc + ' '.repeat(Math.max((lenMax.bor-lenWord),lenMin)) + '残高' 
      } else {
        const len1st = Math.max(lenMax.pmt-lenWord, lenMin);
        return '年月 '  + ' '.repeat(len1st) + '返済' + spc + ' '.repeat(Math.max((lenMax.ipmt-lenWord),lenMin)) + '利息' + spc + ' '.repeat(Math.max((lenMax.bor-lenWord),lenMin)) + '残高' 
      }
    }
  }
  public strYearTitle(tgtTerm:number){
    const month   = (this.startMonth + tgtTerm - 1 ) % 12 + 1;
    const year    = this.startYear + Math.floor(( this.startMonth + tgtTerm -1 ) / 12);
    if ( tgtTerm==0 || month == 1){
      return year + '年(' + Math.floor(year - this.startYear + 1) + '年目)\n'
    } else {
      return ""
    }
  }
  public strPaymentArea(strLenMin:number){
    return this._strPaymentArea(strLenMin,false);
  }
  public strPaymentAreaWide(strLenMin:number){
    return this._strPaymentArea(strLenMin,true);
  }
  private _strPaymentArea(strLenMin:number, _isWide:boolean ){
    let bal = this.activeLoan.loanBorrow;
    let month = 0;
    let year  = 0;
    let pmt   = 0;
    let ipmt  = 0;
    let ppmt  = 0;
    let str   = "";
    const spc:string  = ' '.repeat(LoanService.STR_SPACE);
    const lenMax = this.getLenMax();
    const totalRows = this.activeLoan.payCount + 1;
    const lenMin  = strLenMin;
    for ( let term = 0; term < totalRows; term++){
      month = (this.startMonth + term - 1) % 12 + 1;
      year  = this.startYear + Math.floor((this.startMonth + term - 1) / 12);
      if (term === 0) {
        pmt  = 0;
        ppmt = 0;
        ipmt = 0;
      } else {
        pmt  = this.getPmt(term);
        ppmt = this.getPpmt(term);
        ipmt = this.getIpmt(term);
        bal  = bal - ppmt; 
      }
      if ( term == 0 || month == 1 ){   
        let titleStr = "";
        if (term === 0){
          if (this.startMonth === 1) {
            titleStr = year + '年(1年目)\n';
          } else {
            titleStr = year + '年\n';
          }          
        } else {
          const displayYear  = Math.floor((term - 1) / 12); // 経過した年数 (0, 1, 2...)
          const displayMonth = ((term - 1) % 12) + 1;       // 通算何ヶ月目か (1〜12)
          if (this.startMonth === 1) {
            const displayYearIdx = Math.floor(term / 12) + 1;
            titleStr = year + '年(' + displayYearIdx + '年目)\n';
          } else {
            if (displayYear === 0) {
              titleStr = year + '年(' + displayMonth + 'ヶ月目〜)\n';
            } else {
              titleStr = year + '年(' + displayYear + '年' + displayMonth + 'ヶ月目〜)\n';
            }
          }
        }
        str = str + titleStr;
      }
      str = str + this.fixLen(month+'',2) + '月' + spc;
      if (_isWide){
          str = str + this.fixLen(pmt.toLocaleString(), Math.max(lenMax.pmt,lenMin) )    + spc; 
          str = str + this.fixLen(ppmt.toLocaleString(), Math.max(lenMax.ppmt,lenMin) )  + spc; 
      } else {
        if (this.activeLoan.levelPayment){
          str = str + this.fixLen(ppmt.toLocaleString(), Math.max(lenMax.ppmt,lenMin) )  + spc; 
        } else {
          str = str + this.fixLen(pmt.toLocaleString(), Math.max(lenMax.pmt,lenMin) )    + spc; 
        }
      }
      str = str + this.fixLen(ipmt.toLocaleString(), Math.max(lenMax.ipmt,lenMin) )      + spc; 
      str = str + this.fixLen(Math.max(0, bal).toLocaleString(), Math.max(lenMax.bor,lenMin) ) + '\n';
    }
    return str;
  }
  private fixLen( str:string, length:number){
    const orgLen = str.length;
    const numRepeat = length - orgLen >= 0 ? length - orgLen : 1;
    const reStr = ' '.repeat( numRepeat ) + str;
    return reStr;
  }
  private getLenMax() : { bor:number, pmt:number, ppmt:number, ipmt:number} {
    const lastTerm    = this.activeLoan.payCount;
    const lenBorMax   = this.activeLoan.loanBorrow.toLocaleString().length;
    const lenPmtMax   = this.getPmt(1).toLocaleString().length;
    const lenPpmtMax  = this.getPpmt(lastTerm).toLocaleString().length;
    const lenIpmtMax  = this.getIpmt(1).toLocaleString().length;

    return {bor:lenBorMax, pmt:lenPmtMax, ppmt:lenPpmtMax, ipmt:lenIpmtMax}
  }

  //===========================================================================
  public getName(){
    return this.name;
  }
  public getPmt(tgtTerm:number){   //1origin
    if ( tgtTerm > 0 && tgtTerm <= this.arrPmt.length ){
      return this.arrPmt[tgtTerm-1];
    } else {
      return 0;
    }
  }
  public getPpmt(tgtTerm:number){   //1origin
    if ( tgtTerm > 0 && tgtTerm <= this.arrPpmt.length ){
      return this.arrPpmt[tgtTerm-1];
    }
    return 0;
  }
  public getIpmt(tgtTerm:number){   //1origin
    if ( tgtTerm > 0 && tgtTerm <= this.arrIpmt.length ){
      return this.arrIpmt[tgtTerm-1];
    }
    return 0;    
  }
  public getLb(tgtTerm:number){   //1origin
    if (tgtTerm == 0 ){
      return this.activeLoan.loanBorrow;
    } else if ( tgtTerm > 0 && tgtTerm <= this.arrLb.length ){
      return this.arrLb[tgtTerm-1];
    } else {
      return 0;
    }
  }
  public getPmtYear(tgtYear:number){   //1origin
    const tgtTerm = ( tgtYear-1) * 12 +1;
    let sum = 0;
    for ( let i = 0; i < 12; i++){
      sum = sum + this.getPmt(tgtTerm+i);
    }
    return sum;
  }
  public getPmtAll() {
    let sum = 0;
    for (let i = 0; i < this.arrPmt.length; i++) {
      sum += this.arrPmt[i];
    }
    return sum;
  }
  public getIpmtAll() {
    let sum = 0;
    for (let i = 0; i < this.arrIpmt.length; i++) {
      sum += this.arrIpmt[i];
    }
    return sum;
  }
  private calcAll(_loan:ILoan ){
    let lb_term:number      = 0;
    let pmt_term:number     = 0;
    let ipmt_term:number    = 0;
    let ppmt_term:number    = 0;
    let month:string         = "";

    this.arrMonth           = [];
    this.arrPmt             = [];
    this.arrPpmt            = [];
    this.arrIpmt            = [];
    this.arrLb              = [];
    if (_loan.levelPayment){
      // 元利均等方式
      pmt_term = - Math.ceil( this.financeSvc.pmt(_loan.rateYear/12, _loan.payCount, _loan.loanBorrow) );
      lb_term = _loan.loanBorrow;
      for ( let term = 0; term < _loan.payCount; term++ ){
        month   = this.fixLen(((this.payStartMonth + term - 1 ) % 12 + 1 ) + '',2);
        ipmt_term = Math.floor( lb_term * _loan.rateYear / 12 );
        if ( term  < _loan.payCount -1 ){
          ppmt_term = pmt_term - ipmt_term;
          lb_term   = lb_term - ppmt_term;
        } else {
          // 最終回は端数処理
          ppmt_term = lb_term;
          pmt_term  = ppmt_term + ipmt_term;
          lb_term   = 0;          
        }
        this.arrMonth.push( month);
        this.arrPmt.push(  pmt_term );
        this.arrPpmt.push( ppmt_term );
        this.arrIpmt.push( ipmt_term );
        this.arrLb.push(   lb_term );
      }
    } else {
      //元金均等方式
      ppmt_term = - Math.ceil( this.financeSvc.ppmtP(_loan.rateYear/12, _loan.payCount, _loan.loanBorrow) );
      lb_term   = _loan.loanBorrow;
      for ( let term = 0; term < _loan.payCount; term++ ){
        ipmt_term = Math.floor( lb_term * _loan.rateYear / 12 );
        if ( term < _loan.payCount - 1){
          lb_term = lb_term - ppmt_term;
        } else {
          // 最終回は端数処理
          ppmt_term = lb_term;
          lb_term   = 0;
        }
        pmt_term = ppmt_term + ipmt_term;
        this.arrPmt.push(  pmt_term );
        this.arrPpmt.push( ppmt_term );
        this.arrIpmt.push( ipmt_term );
        this.arrLb.push(   lb_term );
      }
    }
  }
  //===========================================================================
}