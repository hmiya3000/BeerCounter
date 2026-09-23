import { Injectable,ChangeDetectorRef } from '@angular/core';
import { TAX_COMPANY_SETTINGS, TAX_PERSONAL_SETTINGS } from 'src/app/config/tax-constants';

@Injectable({
  providedIn: 'root',
})
export class InputService {
  private lastAssessCalcTime:number   = 0;

  //===========================================================================
  public readUpdateText(value:string, type:string, strPrev:string, lengthMax:number){
    let retVal:string   = strPrev;
    if (type === 'ionInput'){
      retVal                    = this.correctLengthMax(value, lengthMax);
    } else if (type === 'ionBlur'){
      if (value !== ''){
        retVal                  = this.correctLengthMax(value, lengthMax);
      }
    }
    return retVal;
  }
  //===========================================================================
  public readUpdateZeroPosiInt(value:number, type:string, numPrev:number, numMax:number) : {updateNum:number, correctStr:string, isChange:boolean}{
    let retValupdate:number       = value;
    let retValIsChange:boolean    = false;
    let retValCorrect:string      = value + ''
    if (type === 'ionInput'){
      const filteredValue         = this.filterPosiInt(value);
      const retVal                = this.correctZeroPosiInt(filteredValue,numPrev,numMax);
      retValCorrect               = retVal.strValue;
      retValIsChange              = retVal.isChange;
      if (retValIsChange){
        retValupdate              = retVal.numValue;
      }
    } else if (type === 'ionBlur'){
      retValCorrect               = this.correctZeroPosiOnBlur(value,  numPrev, 0).strValue;
    }
    return { updateNum: retValupdate, correctStr:retValCorrect, isChange: retValIsChange}
  }
  //===========================================================================
  public readUpdatePosiInt(value:number, type:string, numPrev:number, numMax:number) : {updateNum:number, correctStr:string, isChange:boolean}{
    let retValupdate:number       = value;
    let retValIsChange:boolean    = false;
    let retValCorrect:string      = value + ''
    if (type === 'ionInput'){
      const filteredValue         = this.filterPosiInt(value);
      const retVal                = this.correctPosiInt(filteredValue,numPrev,numMax);
      retValCorrect               = retVal.strValue;
      retValIsChange              = retVal.isChange;
      if (retValIsChange){
        retValupdate              = retVal.numValue;
      }
    } else if (type === 'ionBlur'){
      retValCorrect               = this.correctPosiOnBlur(value,  numPrev, 0).strValue;
    }
    return { updateNum: retValupdate, correctStr:retValCorrect, isChange: retValIsChange}
  }
  //===========================================================================
  public readUpdatePosiNum(value:number, type:string, numPrev:number, numMax:number, decPlace:number) : {updateNum:number, correctStr:string, isChange:boolean}{
    let retValupdate:number       = value;
    let retValIsChange:boolean    = false;
    let retValCorrect:string      = value + ''
    if (type === 'ionInput'){
      const filteredValue         = this.filterPosiNum(value);
      const retVal                = this.correctPosiNum(filteredValue,numPrev,numMax, decPlace);
      retValCorrect               = retVal.strValue;
      retValIsChange              = retVal.isChange;
      if (retValIsChange){
        retValupdate              = retVal.numValue;
      }
    } else if (type === 'ionBlur'){
      retValCorrect               = this.correctPosiOnBlur(value,  numPrev, decPlace).strValue;
    }
    return { updateNum: retValupdate, correctStr:retValCorrect, isChange: retValIsChange}
  }
  //===========================================================================
  public readUpdateZeroPosiNum(value:number, type:string, numPrev:number, numMax:number, decPlace:number) : {updateNum:number, correctStr:string, isChange:boolean}{
    let retValupdate:number       = value;
    let retValIsChange:boolean    = false;
    let retValCorrect:string      = value + ''
    if (type === 'ionInput'){
      const filteredValue         = this.filterPosiNum(value);
      const retVal                = this.correctZeroPosiNum(filteredValue,numPrev,numMax, decPlace);
      retValCorrect               = retVal.strValue;
      retValIsChange              = retVal.isChange;
      if (retValIsChange){
        retValupdate              = retVal.numValue;
      }
    } else if (type === 'ionBlur'){
      retValCorrect               = this.correctZeroPosiOnBlur(value,  numPrev, decPlace).strValue;
    }
    return { updateNum: retValupdate, correctStr:retValCorrect, isChange: retValIsChange}
  }
  //===========================================================================
  public onIonRange( _value:number, _type:string, _itemId:number, _func:(val: number, _itemId:number) => void, _cdr:ChangeDetectorRef){
    if (_type == "ionInput"){
      const now = Date.now();
      if (now - this.lastAssessCalcTime >= 50) {
        _func(_value, _itemId);
        this.lastAssessCalcTime = now;
        setTimeout(() => {
          _cdr.detectChanges();
        }, 0);
      }
    } else if (_type == "ionChange"){
      //決定時
      _func(_value, _itemId);
      _cdr.detectChanges();
    }
  }  
  //===========================================================================
  public parseIntCorrect( orgData:any, numDefault:number, numMin:number, numMax:number) : number {
    if ( orgData == undefined || orgData === null){
      return numDefault;
    } else {
      let parsedIntTmp  = parseInt(orgData, 10);
      if (isNaN(parsedIntTmp)) {
        return numDefault;
      }
      parsedIntTmp      = parsedIntTmp > numMax ? numMax : parsedIntTmp;
      parsedIntTmp      = parsedIntTmp < numMin ? numMin : parsedIntTmp;
      return parsedIntTmp;
    }
  }
  public parseIntRoundDown( orgData:any, numDefault:number, numMin:number, numMax:number) : number {
    if ( orgData == undefined || orgData === null){
      return numDefault;
    } else {
      let parsedIntTmp = parseInt(orgData, 10);
      if (isNaN(parsedIntTmp)) {
        return numDefault;
      }
      if (numMax <= 0){
        return numMax;
      }
      while (parsedIntTmp > numMax){
        parsedIntTmp = parsedIntTmp /10;
      }
      let parsedRound = Math.floor(parsedIntTmp);
      parsedRound = parsedRound < numMin ? numMin : parsedRound;
      return parsedRound;
    }
  }
  public parseFloatCorrect( orgData:any, numDefault:number, numMin:number, numMax:number) : number {
    if ( orgData == undefined || orgData === null){
      return numDefault;
    } else {
      let parsedFloatTmp  = parseFloat(orgData);
      if (isNaN(parsedFloatTmp)) {
        return numDefault;
      }      
      parsedFloatTmp      = parsedFloatTmp > numMax ? numMax : parsedFloatTmp;
      parsedFloatTmp      = parsedFloatTmp < numMin ? numMin : parsedFloatTmp;
      return parsedFloatTmp;
    }
  }
  public parseBooleanCorrect( orgData:any, boolDefault:boolean) : boolean {
    if ( orgData == undefined || orgData === null){
      return boolDefault;
    } else {
      const strData = String(orgData);
      return strData === '1' || strData === 'true';
    }
  }
  //===========================================================================
  public parseTaxOld( orgData:any) : { rateTax:number, isCompany:boolean}{
    const rateTaxOld:number = ( orgData == undefined || orgData === null) ? 0 : orgData;
    let _isCompany:boolean = false;
    let _rateTax:number    = 0;
    if ( rateTaxOld <= 0.16){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[0].tax;
    } else if ( 0.16 < rateTaxOld && rateTaxOld <= 0.21 ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[1].tax;
    } else if ( 0.21 < rateTaxOld && rateTaxOld <= 0.215 ){
      _isCompany = true;
      _rateTax   = TAX_COMPANY_SETTINGS[0].tax;
    } else if ( 0.215 < rateTaxOld && rateTaxOld <= 0.233 ){
      _isCompany = true;
      _rateTax   = TAX_COMPANY_SETTINGS[1].tax;
    } else if ( 0.233 < rateTaxOld && rateTaxOld <= 0.31 ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[2].tax;
    } else if ( 0.31 < rateTaxOld && rateTaxOld <= 0.34 ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[3].tax;
    } else if ( 0.34 < rateTaxOld && rateTaxOld <= 0.37 ){
      _isCompany = true;
      _rateTax   = TAX_COMPANY_SETTINGS[2].tax;
    } else if ( 0.37 < rateTaxOld && rateTaxOld <= 0.44 ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[4].tax;
    } else if ( 0.44 < rateTaxOld && rateTaxOld <= 0.51 ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[5].tax;
    } else if ( 0.51 < rateTaxOld ){
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[6].tax;
    } else {
      _isCompany = false;
      _rateTax   = TAX_PERSONAL_SETTINGS[0].tax;
    }
    return {rateTax:_rateTax, isCompany:_isCompany}
  }
  //===========================================================================
  //  文字の長さを指定した最大値に制限
  private correctLengthMax( inStr:string, lengthMax:number){
    if (!inStr){
      return '';
    }
    if ( inStr.length > lengthMax){
      return inStr.slice(0,lengthMax);
    }
    return inStr;
  }
  //===========================================================================
  //  正の整数にフィルタ(小数を含まない)
  private filterPosiInt( _inValue:any){
    let value = _inValue || '';
    // 1. 全角数字を半角数字に自動変換
    value = value.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    // 2. 数字以外をすべて除去
    let filteredValue = value.replace(/[^0-9]/g, '');
    filteredValue = filteredValue.replace(/^0+$/, '0'); //変換した結果、全てが0だった場合は'0'の1文字に変換
    return filteredValue;
  }
  public filterPosiIntTest(){

    let _inValue:any[]  = ['0' ,'9' ,' ' ,'.'  ,'０', '９' ,'A' ];
    let _outValue:any[] = ['0' ,'9' ,''  ,''   ,'0' , '9' , '' ];

    console.log('[Input]filterPosiIntTest')
    let isExistNG:boolean = false;
    for ( let i = 0; i< _inValue.length; i++){
      const filterdVal = this.filterPosiInt(_inValue[i]);
      const isOk        = _outValue[i] === filterdVal ? true : false
      const judge         = isOk ? '[OK]' : '[NG]'
      if (judge === '[NG]'){
        console.log(judge,'_inValue:[',_inValue[i],']filterdVal:[',filterdVal,']', isOk);
        isExistNG = true;
      }
    }
    if (!isExistNG){
      console.log('[Input]filterPosiIntTest:All OK')
    }
  }
  //===========================================================================
  //  正の数にフィルタ(小数を含む)
  private filterPosiNum( _inValue:any){
    let value = _inValue || '';
    // 1. 全角数字を半角数字に自動変換
    value = value.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    // 2. 数字と小数点以外をすべて除去
    let filteredValue = value.replace(/[^0-9.]/g, '');
    // 3. 小数点が2つ以上入力されるのを防ぐ
    const parts = filteredValue.split('.');
    if (parts.length > 2) {
      // 💡 先頭が空（.から始まった）の場合は 0 を補完する
      const firstPart = parts[0] === '' ? '0' : parts[0];
      filteredValue = firstPart + '.' + parts.slice(1).join('');
    }
    // 💡 【追加】クリア後に「.」だけが入力された場合、自動的に「0.」に補正する
    if (filteredValue === '.') {
      filteredValue = '0.';
    }
    filteredValue = filteredValue.replace(/^0+$/, '0'); //変換した結果、全てが0だった場合は'0'の1文字に変換
    return filteredValue;
  }

  public filterPosiNumTest(){

    let _inValue:any[]  = ['0' ,'9' ,' ' ,'.' ,'0..' ,'0.1.' ,'０', '９' ,'A' ];
    let _outValue:any[] = ['0' ,'9' ,''  ,'0.','0.'  ,'0.1'  ,'0' , '9' , '' ];

    console.log('[Input]filterPosiNumTest')
    let isExistNG:boolean = false;
    for ( let i = 0; i< _inValue.length; i++){
      const filterdVal = this.filterPosiNum(_inValue[i]);
      const isOk        = _outValue[i] === filterdVal ? true : false
      const judge         = isOk ? '[OK]' : '[NG]'
      if (judge === '[NG]'){
        console.log(judge,'_inValue:[',_inValue[i],']filterdVal:[',filterdVal,']', isOk);
        isExistNG = true;
      }
    }
    if (!isExistNG){
      console.log('[Input]filterPosiNumTest:All OK')
    }
  }
  //===========================================================================
  //  正の整数、最大値の範囲に補正
  private correctPosiInt( filteredValue:string, numPrev:number, numMax:number): {strValue:string, numValue:number, isChange:boolean}{
    let strRet:string   = '';
    let numRet:number   = 0;
    let isChangeRet:boolean  = false;

    if (filteredValue == ''){
      numRet      = numPrev;
      strRet      = filteredValue;
    } else {
      const numValue = filteredValue ? parseFloat(filteredValue) : 0;     // 数値計算用に型変換（空文字の場合は0にする）
      if ( numValue == numPrev || numValue > numMax ){
        //値が変わっていない(小数点など無効な文字入力)、最大値を超えたら、前回の確定値に復帰
        numRet      = numPrev
        strRet      = numPrev.toString();
      } else if (numValue == 0){
        //0は対象外なので空白に変更、数字は前回の確定値
        numRet      = numPrev
        strRet      = '';   
      } else {
        isChangeRet = true;
        numRet      = Math.floor(numValue)
        strRet      = numRet.toString();
      }
    }
    return {strValue:strRet, numValue:numRet, isChange:isChangeRet }
  }
  public correctPosiIntTest(){
    
    let input:{strPrev:string,inVal:string,numPrev:number,numMax:number,strValue:string,numValue:number,isChange:boolean}[]
    = [
      {numPrev:10, strPrev:'',    inVal:'2',  numMax:99,  strValue:'2' , numValue:2,   isChange:true},
      {numPrev:10, strPrev:'',    inVal:'0',  numMax:99,  strValue:''  , numValue:10,  isChange:false},
      {numPrev:10, strPrev:'',    inVal:'.',  numMax:99,  strValue:''  , numValue:10,  isChange:false},
      {numPrev:1,  strPrev:'1',   inVal:'1',  numMax:99,  strValue:'11', numValue:11,  isChange:true},
      {numPrev:10, strPrev:'10',  inVal:'1',  numMax:99,  strValue:'10', numValue:10,  isChange:false},
      {numPrev:99, strPrev:'99',  inVal:'1',  numMax:99,  strValue:'99', numValue:99,  isChange:false},
      {numPrev:99, strPrev:'99',  inVal:'1',  numMax:99,  strValue:'99', numValue:99,  isChange:false},
    ]
    console.log('[Input]correctPosiIntTest')
    let isExistNG:boolean = false;
    for ( let i = 0; i< input.length; i++){

      const filteredValue = this.filterPosiInt(input[i].strPrev + input[i].inVal)
      const retval  = this.correctPosiInt(filteredValue,input[i].numPrev,input[i].numMax);
      const isOkstrValue  = retval.strValue === input[i].strValue ? true : false;
      const isOknumValue  = retval.numValue === input[i].numValue ? true : false;
      const isOkisChange  = retval.isChange === input[i].isChange ? true : false;
      const judge         = isOkstrValue && isOknumValue && isOkisChange ? '[OK]' : '[NG]'
      if (judge === '[NG]'){
        console.log(judge,
        'numPrev',input[i].numPrev,
        'strPrev[',input[i].strPrev,
        ']+inVal[',input[i].inVal,
        ']->filteredValue',filteredValue,
        'numMax',input[i].numMax,
        '->strValue',retval.strValue,isOkstrValue,'numValue',retval.numValue,isOknumValue,'isChange',retval.isChange,isOkisChange);
        isExistNG = true;
      }
    }
    if (!isExistNG){
      console.log('[Input]correctPosiIntTest:All OK')
    }
  }

  public correctPosiNumTest(){
    
    let input:{strPrev:string,inVal:string,numPrev:number,numMax:number,decPlace:number, strValue:string,numValue:number,isChange:boolean}[]
    = [
      {numPrev:999999, strPrev:'999999',  inVal:'0', numMax:999999.9999, decPlace:4, strValue:'999999',  numValue:999999, isChange:false},
      {numPrev:123456, strPrev:'123456',  inVal:'1', numMax:999999.9999, decPlace:4, strValue:'123456',  numValue:123456, isChange:false},
      {numPrev:999999, strPrev:'999999',  inVal:'.', numMax:999999.9999, decPlace:4, strValue:'999999.', numValue:999999, isChange:false},
      {numPrev:365,    strPrev:'365',     inVal:'.', numMax:365.0,       decPlace:3, strValue:'365',     numValue:365,    isChange:false},
      {numPrev:999999, strPrev:'999999.', inVal:'.', numMax:999999.9999, decPlace:4, strValue:'999999.', numValue:999999, isChange:false},
      {numPrev:1000,   strPrev:'',        inVal:'.', numMax:999999.9999, decPlace:4, strValue:'0.',      numValue:1000,   isChange:false},
      {numPrev:1000,   strPrev:'',        inVal:'0', numMax:999999.9999, decPlace:4, strValue:'0',       numValue:1000,   isChange:false},
      {numPrev:1000,   strPrev:'',        inVal:'1', numMax:999999.9999, decPlace:4, strValue:'1',       numValue:1,      isChange:true },
      {numPrev:0,      strPrev:'0.',      inVal:'0', numMax:365.0,       decPlace:3, strValue:'0.0',     numValue:0,      isChange:false},
      {numPrev:0,      strPrev:'0.',      inVal:'1', numMax:365.0,       decPlace:3, strValue:'0.1',     numValue:0.1,    isChange:true },
      {numPrev:0,      strPrev:'0.0',     inVal:'0', numMax:365.0,       decPlace:3, strValue:'0.00',    numValue:0,      isChange:false},
      {numPrev:0,      strPrev:'0.0',     inVal:'1', numMax:365.0,       decPlace:3, strValue:'0.01',    numValue:0.01,   isChange:true },
      {numPrev:0,      strPrev:'0.00',    inVal:'0', numMax:365.0,       decPlace:3, strValue:'0.00',    numValue:0,      isChange:false},
      {numPrev:0,      strPrev:'0.00',    inVal:'1', numMax:365.0,       decPlace:3, strValue:'0.001',   numValue:0.001,  isChange:true },
      {numPrev:0.001,  strPrev:'0.001',   inVal:'0', numMax:365.0,       decPlace:3, strValue:'0.001',   numValue:0.001,  isChange:false },
      {numPrev:0.001,  strPrev:'0.001',   inVal:'1', numMax:365.0,       decPlace:3, strValue:'0.001',   numValue:0.001,  isChange:false },
      {numPrev:1,      strPrev:'1.',      inVal:'0', numMax:365.0,       decPlace:3, strValue:'1.0',     numValue:1,      isChange:false},
      {numPrev:1,      strPrev:'1.',      inVal:'1', numMax:365.0,       decPlace:3, strValue:'1.1',     numValue:1.1,    isChange:true },
      {numPrev:1,      strPrev:'1.0',     inVal:'0', numMax:365.0,       decPlace:3, strValue:'1.00',    numValue:1,      isChange:false},
      {numPrev:1,      strPrev:'1.0',     inVal:'1', numMax:365.0,       decPlace:3, strValue:'1.01',    numValue:1.01,   isChange:true },
      {numPrev:1,      strPrev:'1.00',    inVal:'0', numMax:365.0,       decPlace:3, strValue:'1.00',    numValue:1,      isChange:false},
      {numPrev:1,      strPrev:'1.00',    inVal:'1', numMax:365.0,       decPlace:3, strValue:'1.001',   numValue:1.001,  isChange:true },
      {numPrev:1.001,  strPrev:'1.001',   inVal:'0', numMax:365.0,       decPlace:3, strValue:'1.001',   numValue:1.001,  isChange:false },
      {numPrev:1.001,  strPrev:'1.001',   inVal:'1', numMax:365.0,       decPlace:3, strValue:'1.001',   numValue:1.001,  isChange:false },
    ]
    console.log('[Input]correctPosiNumTest')
    let isExistNG:boolean = false;
    for ( let i = 0; i< input.length; i++){

      const filteredValue = this.filterPosiNum(input[i].strPrev + input[i].inVal)
      const retval  = this.correctPosiNum(filteredValue,input[i].numPrev,input[i].numMax, input[i].decPlace);
      const isOkstrValue  = retval.strValue === input[i].strValue ? true : false;
      const isOknumValue  = retval.numValue === input[i].numValue ? true : false;
      const isOkisChange  = retval.isChange === input[i].isChange ? true : false;
      const judge         = isOkstrValue && isOknumValue && isOkisChange ? '[OK]' : '[NG]'
      if (judge === '[NG]'){
        console.log(judge,
          this.strIsOk(isOkstrValue),this.strIsOk(isOknumValue),this.strIsOk(isOknumValue),
          ':numPrev',input[i].numPrev,
          'strPrev[',input[i].strPrev,
          ']+inVal[',input[i].inVal,
          ']->filteredValue',filteredValue,
          'numMax',input[i].numMax,
          '->strValue',retval.strValue,'numValue',retval.numValue,'isChange',retval.isChange);
        isExistNG = true;
      }
    }
    if (!isExistNG){
      console.log('[Input]correctPosiIntTest:All OK')
    }

  }
  strIsOk(_isOk:boolean){
    return _isOk ? 'o' : 'x'
  }
  //===========================================================================
  //  ０と正の整数、最大値の範囲に補正
  private correctZeroPosiInt( filteredValue:string, numPrev:number, numMax:number): {strValue:string, numValue:number, isChange:boolean}{
    let strRet:string   = '';
    let numRet:number   = 0;
    let isChangeRet:boolean  = false;

    if (filteredValue == ''){
      numRet      = numPrev;
      strRet      = filteredValue;
    } else {
      const numValue = filteredValue ? parseFloat(filteredValue) : 0;     // 数値計算用に型変換（空文字の場合は0にする）
      if ( numValue == numPrev || numValue > numMax ){
        //値が変わっていない(小数点など無効な文字入力)、最大値を超えたら、前回の確定値に復帰
        numRet      = numPrev
        strRet      = numPrev.toString();
      } else {
        isChangeRet = true;
        numRet      = Math.floor(numValue)
        strRet      = numRet.toString();
      }
    }
    return {strValue:strRet, numValue:numRet, isChange:isChangeRet }
  }
  //===========================================================================
  //  正の数、最大値、小数点以下第"decPlace"位の範囲に補正
  private correctPosiNum( filteredValue:string, numPrev:number, numMax:number,decPlace:number): {strValue:string, numValue:number, isChange:boolean}{
    let strRet:string       = '';
    let numRet:number       = 0;
    let isChangeRet:boolean = false;

    if (filteredValue == ''){
      numRet      = numPrev;
      strRet      = filteredValue;
    } else {
      const numValue = filteredValue ? parseFloat(filteredValue) : 0;
      if (numValue > numMax) {
        //最大値を超えたら、前回の確定値に復帰
        strRet      = numPrev.toString();
        numRet      = numPrev
      } else if ( numValue == numPrev || numValue == 0) {
        if ( numValue >= numMax ){
          //最大値を超えたら、前回の確定値に復帰
          strRet      = numPrev.toString();
          numRet      = numPrev
        } else {
          //数値が変わっていない(無効な文字入力or小数点だけ)は入力データをそのまま返す
          let place:number        = 1;
          for( let i = 0; i < decPlace; i++){
            place = place * 10;
          }
          const numValueDelta:number  = parseFloat(filteredValue + '1')
          const numAddFloor = Math.floor( Math.round(numValueDelta *place *10)/10) / place ;
          if ( numValue !=  numAddFloor){
            //最下位に1を足して切り捨て処理したら値が変わった＝切り捨て発生しなかったので入力桁OK
            strRet      = filteredValue;
            numRet      = numPrev        
          } else {
            //最下位に1を足して切り捨て処理しても値が同じ＝切り捨て発生したので入力桁NG
            const lastChar = filteredValue.slice(-1)
            if (lastChar === '0'){
              // 1.000 が入力された場合、無効なので 1.00 に戻す
              strRet      = filteredValue.slice(0, -1);
              numRet      = numPrev
            } else {
              // 1.005 を入力してクリアし、もう一度 1.005 が入力された場合、反映してOK
              strRet      = filteredValue;
              numRet      = numPrev
            }
          }
        }
      } else {
        //最大値越えない && 前回確定値と違う && ０ではない →有効な値が入った
        let place:number        = 1;
        for( let i = 0; i < decPlace; i++){
          place = place * 10;
        }
        //最大値ではない小数点以下の処理
        const numValueFloor:number  = Math.floor( Math.round(numValue * place *10)/10)  /place;
        if (numValue != numValueFloor){
          //「小数点以下第3位の指定」で第4位の桁の数字が入ってたので削って返す
          strRet      = numValueFloor.toString();
          numRet      = numValueFloor;
        } else {
          isChangeRet = true;
          strRet      = filteredValue;
          numRet      = numValue;
        }
      }
    }
    return {strValue:strRet, numValue:numRet, isChange:isChangeRet }
  }
  //===========================================================================
  //  ０、正の数、最大値、小数点以下第"decPlace"位の範囲に補正
  private correctZeroPosiNum( filteredValue:string, numPrev:number, numMax:number,decPlace:number): {strValue:string, numValue:number, isChange:boolean}{
    let strRet:string       = '';
    let numRet:number       = 0;
    let isChangeRet:boolean = false;

    if (filteredValue == ''){
      numRet      = numPrev;
      strRet      = filteredValue;
    } else {
      const numValue = filteredValue ? parseFloat(filteredValue) : 0;
      if (numValue > numMax) {
        //最大値を超えたら、前回の確定値に復帰
        strRet      = numPrev.toString();
        numRet      = numPrev
      } else if ( numValue == numPrev ) {
        if ( numValue >= numMax ){
          //最大値を超えたら、前回の確定値に復帰
          strRet      = numPrev.toString();
          numRet      = numPrev
        } else {
          //数値が変わっていない(無効な文字入力or小数点だけ)は入力データをそのまま返す
          let place:number        = 1;
          for( let i = 0; i < decPlace; i++){
            place = place * 10;
          }
          const numValueDelta:number  = parseFloat(filteredValue + '1')
          const numAddFloor = Math.floor( Math.round(numValueDelta *place *10)/10) / place ;
          if ( numValue !=  numAddFloor){
            //最下位に1を足して切り捨て処理したら値が変わった＝切り捨て発生しなかったので入力桁OK
            strRet      = filteredValue;
            numRet      = numPrev        
          } else {
            //最下位に1を足して切り捨て処理しても値が同じ＝切り捨て発生したので入力桁NG
            const lastChar = filteredValue.slice(-1)
            if (lastChar === '0'){
              // 1.000 が入力された場合、無効なので 1.00 に戻す
              strRet      = filteredValue.slice(0, -1);
              numRet      = numPrev
            } else {
              // 1.005 を入力してクリアし、もう一度 1.005 が入力された場合、反映してOK
              strRet      = filteredValue;
              numRet      = numPrev
            }
          }
        }
      } else {
        //最大値越えない && 前回確定値と違う →有効な値が入った
        let place:number        = 1;
        for( let i = 0; i < decPlace; i++){
          place = place * 10;
        }
        //最大値ではない小数点以下の処理
        const numValueFloor:number  = Math.floor( Math.round(numValue * place *10)/10)  /place;
        if (numValue != numValueFloor){
          //「小数点以下第3位の指定」で第4位の桁の数字が入ってたので削って返す
          strRet      = numValueFloor.toString();
          numRet      = numValueFloor;
        } else {
          isChangeRet = true;
          strRet      = filteredValue;
          numRet      = numValue;
        }
      }
    }
    return {strValue:strRet, numValue:numRet, isChange:isChangeRet }
  }
  //===========================================================================
  private correctZeroPosiOnBlur( value:any, numPrev:number, decPlace:number ) : {strValue:string, isChange:boolean}{
    let strRet:string   = '';
    let isChangeRet:boolean  = false;
    if (!value || value === '') { 
      strRet      = numPrev.toString();
      isChangeRet = true;
    } else {
      let place:number        = 1;
      for( let i = 0; i < decPlace; i++){
        place = place * 10;
      }
      strRet      = (Math.floor( value * place)/place).toString();
      isChangeRet = false;
    } 
    return {strValue:strRet, isChange:isChangeRet }
  }
  //===========================================================================
  private correctPosiOnBlur( value:any, numPrev:number, decPlace:number ) : {strValue:string, isChange:boolean}{
    let strRet:string   = '';
    let isChangeRet:boolean  = false;
    if (!value || value === '' || value === '0.'|| value == 0) { 
      strRet      = numPrev.toString();
      isChangeRet = true;
    } else {
      let place:number        = 1;
      for( let i = 0; i < decPlace; i++){
        place = place * 10;
      }
      strRet      = (Math.floor( value * place)/place).toString();
      isChangeRet = false;
    } 
    return {strValue:strRet, isChange:isChangeRet }
  }
  //===========================================================================
}
