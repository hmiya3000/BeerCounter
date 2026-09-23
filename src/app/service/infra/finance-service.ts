import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  constructor() { }

  //==================================================
  //支払い額(元利均等方式)
  public pmt( rate:number, period:number, value:number){
    let tmp = 1;
    for ( let i=0; i < period; i++){
      tmp = tmp * ( 1 + rate );
    }
    let pmt_tmp = ( value * rate * tmp ) / ( tmp - 1);
    return -  pmt_tmp;
  }
  //==================================================
  //その期の支払い額(元金均等方式)
  public pmtP( rate:number, term:number, period:number, value:number){
    return  this.ppmtP( rate,       period, value ) 
          + this.ispmt( rate, term, period, value );
  }
  //支払い元金(元金均等方式)
  public ppmtP( rate:number, period:number, value:number){
    return - value / period;
  }
  //その期の支払い利息(元金均等方式)
  public ispmt( rate:number, term:number, period:number, value:number){
    if ( term <= 0 ){
      return 0;
    } else if ( term > period ){
      return 0;
    } else {
      let lpmt = - value * ( term -1 ) / period;
      return lpmt * rate;
    }
  }
}

