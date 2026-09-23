import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType,CameraSource } from '@capacitor/camera'; 
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonList, IonCard, IonCardContent, IonItem, IonRange, IonModal, IonSegmentButton, IonLabel, IonSegment, IonGrid, IonRow, IonCol, IonButtons } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { beer, resizeOutline, createOutline, cameraOutline,camera } from 'ionicons/icons';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-cpu'; 
//---
import { Str } from 'src/app/utils/util';
import { InputService } from 'src/app/service/infra/input-service';
import { WindowService } from 'src/app/service/infra/window-service';
//---
import { APP_CONFIG } from 'src/app/config/app.constants';
import { DEF } from 'src/app/config/default-constants';
import { DrinkService } from 'src/app/service/features/drink-service';
//---
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
//---
@Component({
  selector: 'app-measure',
  templateUrl: './measure.page.html',
  styleUrls: ['./measure.page.scss'],
  standalone: true,
  imports: [IonButtons, IonCol, IonRow, IonGrid, IonSegment, IonLabel, IonSegmentButton, IonModal, IonItem, IonCardContent, IonCard, IonIcon, IonButton, IonContent, IonHeader, IonTitle, IonToolbar,IonRange, CommonModule, FormsModule, SharedModalComponent]
})
export class MeasurePage implements OnInit {

  @ViewChild('imageCanvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modalCanvas', { static: false }) modalCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fixArea',     { read: ElementRef }) fixElement!:      ElementRef;

  public  imageSrc: string | undefined = undefined;
  public  glassType: 'thin' | 'thick' = DEF.GLASS_TYPE;
  private glassCompThin:number        = APP_CONFIG.COMPENSTION_THIN14_5;
  private glassCompThick:number       = APP_CONFIG.COMPENSTION_THICK14;

  public  realHeight:number    = DEF.HEIGHT_MUG;
  public  estimatedVolume: number | null = null;
  public  estimatedLiquidVolume: number | null = null;
  //---
  public foamRatio: number | null = null;   // 泡の比率（%）
  public beerRatio: number | null = null;   // ビールの比率（%）
  //---
  public  isOpenManual:boolean          = false;
  //---
  public  isOpenMeasure:boolean         = false;
  public  tempHeight:number    = DEF.HEIGHT_MUG;
  public  modalPxPerCm: number = 61;
  public  modalMmTicks: number[] = []; 

  public  useAIFrameDetection: boolean = true;
  private isAILoading: boolean = false; 
  public  isManualFit:boolean   = false;
  //---
  public  isOpenResult:boolean   = false;
  //---
  private _capacitor_getPlatform:string   = '';
  private imageObj: HTMLImageElement | null = null;
  private selectedPointIndex: number = -1;
  private points: { x: number, y: number }[] = [];
  public isManualFoamAdjust: boolean = false; 
  constructor(
    private cdr: ChangeDetectorRef,
    private drinkSvc: DrinkService,
    private inputSvc: InputService,
    private windowSvc: WindowService,
  ) {
    addIcons({camera,beer,cameraOutline,createOutline,resizeOutline}); 
    this.modalMmTicks = [];
    for (let i = 0; i <= 250; i++) {
      this.modalMmTicks.push(i);
    }
    this._capacitor_getPlatform = Capacitor.getPlatform();
  }
  ngOnInit() {
  }
  async ionViewWillEnter(){
    ({ pxPerCm: this.modalPxPerCm } = await this.windowSvc.pxInfo());
    this.drinkSvc.readBackup();
    this.initParam();
  }
  public get strCoefDrinkMl(): string{
    if (this.estimatedLiquidVolume && this.estimatedVolume){
      return Str.float( this.estimatedLiquidVolume /  this.estimatedVolume * 100, APP_CONFIG.DEC_PLACE_DEF);
    } else {
      return '--'
    }
  }
  //===========================================================================
  public get strGlassType(): string {
    if (this.estimatedVolume === null){
      return '推定中...';
    } else {
      let _strGrass:string  = ''
      if (this.estimatedVolume < 250*0.8){
        _strGrass = 'コップ';
      } else if (this.estimatedVolume < 435*0.9){
        if (this.glassType === 'thin'){
          _strGrass = 'グラス';
        } else {
          _strGrass = '中スリムジョッキ';
        }
      } else if (this.estimatedVolume < 435*1.1){
        _strGrass = '中ジョッキ';
      } else {
        _strGrass = '大ジョッキ';
      }
      return _strGrass + (this.isManualFit ? '' : '？')
    }
  }
  public get strGlassCompThin(): string {
    return Str.float(this.glassCompThin*100,0);
  }
  public get strGlassCompThick(): string {
    return Str.float(this.glassCompThick*100,0);
  }
  private setGlassComp( _realHeight:number ): {compThick:number, compThin:number }{
    const thick14 = APP_CONFIG.COMPENSTION_THICK14;
    const thick16 = APP_CONFIG.COMPENSTION_THICK16;
    let _glassCompThick:number = thick14;
    if (_realHeight <= 14){
      _glassCompThick   = thick14;
    } else if ( _realHeight >= 16){
      _glassCompThick   = thick16;
    } else {
      const pct = (_realHeight - 14) / (16 - 14); 
      _glassCompThick = thick14 + (thick16 - thick14) * pct;
    }
    const thin9     = APP_CONFIG.COMPENSTION_THIN9;
    const thin14_5  = APP_CONFIG.COMPENSTION_THIN14_5;
    let _glassCompThin:number = thin14_5;
    if (_realHeight <= 9){
      _glassCompThin    = thin9;
    } else if ( _realHeight >= 14.5){
      _glassCompThin    = thin14_5;
    } else {
      const pct = (_realHeight - 9) / (14.5 - 9); 
      _glassCompThin = thin9 + (thin14_5 - thin9) * pct;
    }
    console.log('realHeight:',_realHeight,'compThick:',_glassCompThick,'compThin:',_glassCompThin)
    return {compThick:_glassCompThick, compThin:_glassCompThin}
  }
  //===========================================================================
  private initParam(){
    this.realHeight     = this.drinkSvc.heightMug;
    ({compThick:this.glassCompThick, compThin:this.glassCompThin} = this.setGlassComp(this.realHeight))
    this.isOpenMeasure        = false;
    this.isOpenManual         = false;
    this.isOpenResult         = false;

  }
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if ( key === 'measure'){
      this.tempHeight = this.realHeight;
      if (this.modalMmTicks.length === 0) {
        for (let i = 0; i <= 250; i++){
          this.modalMmTicks.push(i);
        }
      }
      this.isOpenMeasure      = true;
    } else if ( key === 'manual'){
      this.isOpenManual       = true;

    } else if ( key === 'result'){
      if (this.estimatedVolume){
        this.isOpenResult       = true;        
      }

    }
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if ( key === 'measure'){
      this.realHeight         = this.tempHeight;
      this.drinkSvc.setHeightMug( this.realHeight);
      ({compThick:this.glassCompThick, compThin:this.glassCompThin} = this.setGlassComp(this.realHeight))
     this.calculateVolume();
      this.cdr.detectChanges();
      this.isOpenMeasure      = false;

    } else if ( key === 'manual'){
      this.isOpenManual       = false;

    } else if ( key === 'result'){      
      this.isOpenResult       = false;
      this.clearModalCanvas();
    }
    if(!this.isOpenMeasure && !this.isOpenManual && !this.isOpenResult){
      this.windowSvc.resumeAdBannerByModal();
    }
  }
  public modalCancel(){
    this.isOpenMeasure        = false;
    this.isOpenManual         = false;
    this.isOpenResult         = false;
    this.windowSvc.resumeAdBannerByModal();
  }
  public modalPresent(key:string ){
    if (key === 'result'){
      const fixAreaHeight       = this.windowSvc.getElementAreaSize(this.fixElement).height;
      this.windowSvc.updateLayout(this.windowSvc.adBannerHeight);
      const headerHeight        = this.windowSvc.getHeaderAreaHeight('');
      const imageHeight:number  = this.windowSvc.svh  - headerHeight*2 - fixAreaHeight - 20;
      console.log('imageHeight',imageHeight);
      this.drawModalCanvas(imageHeight);
    }
  }
  public onIonRange(ev:any, type:string, key:string){
    if (key === 'height'){
      const _height:number = ev.detail.value;
      this.inputSvc.onIonRange(_height, type,0, (val) => this.upudateHeight(val,0), this.cdr);
    }
  }
  private upudateHeight( _height:number, _menuId:number){
    this.tempHeight = _height;
  }
  //===========================================================================
  async takePicture() {
    this.estimatedVolume  = null;
    this.isManualFit      = false;
    if (this._capacitor_getPlatform === 'web'){
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 90,                  // 画質 (0-100)
        allowEditing: false,           // 撮影後の簡易トリミング（今回は不要なのでfalse）
        resultType: CameraResultType.Uri,  // Webビューで表示しやすいURI形式で取得
//        source: CameraSource.Camera   
      });
      this.imageSrc = image.webPath;
      this.imageObj = new Image();
      if (this.imageSrc) {
        this.imageObj.src = Capacitor.convertFileSrc(this.imageSrc);
      } else {
        this.imageObj.src = '';
      }
      console.log('写真の撮影に成功しました:', this.imageSrc);
      this.imageObj.onload = () => {
        this.initCanvasAndPoints();
      };

    } catch (error) {
      console.error('カメラの起動または撮影に失敗しました:', error);
    }
  }
  private initCanvasAndPoints(){
    if (!this.canvas || !this.imageObj) return;

    setTimeout( async() => {
      const canvasEl = this.canvas.nativeElement;
      const containerWidth = canvasEl.parentElement ? canvasEl.parentElement.clientWidth : window.innerWidth;
      const finalWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
      const imgRatio = this.imageObj!.height / this.imageObj!.width;
      canvasEl.width = containerWidth;
      canvasEl.height = containerWidth * imgRatio;
      const w = canvasEl.width;
      const h = canvasEl.height;
      if (this.useAIFrameDetection) {
        console.log('🤖 AI自動枠推定モードを開始します。');
        this.points = [
          { x: w * 0.3, y: h * 0.2 }, // 0: 左上
          { x: w * 0.7, y: h * 0.2 }, // 1: 右上
          { x: w * 0.7, y: h * 0.8 }, // 2: 右下
          { x: w * 0.3, y: h * 0.8 }  // 3: 左下
        ];
        this.drawCanvas();
        await this.detectJockeyFrameWithAI(w, h);
      } else {
        console.log('✏️ 従来の手動初期配置モードを実行します。');
                this.points = [
          { x: w * 0.3, y: h * 0.2 }, // 0: 左上
          { x: w * 0.7, y: h * 0.2 }, // 1: 右上
          { x: w * 0.7, y: h * 0.8 }, // 2: 右下
          { x: w * 0.3, y: h * 0.8 }  // 3: 左下
        ];
        console.log('💡 Canvasサイズ確定:', w, 'x', h);
        console.log('💡 初期ピン座標:', this.points);
        this.drawCanvas();        
      }
    }, 100);
  }
  private async detectJockeyFrameWithAI(canvasWidth: number, canvasHeight: number) {
    if (this.isAILoading) return;
    this.isAILoading = true;
    try {
      console.log('🤖 TensorFlowのバックエンドを初期化中...');
      await tf.setBackend('cpu');
      await tf.ready();
      console.log('🤖 本物の AI モデル（COCO-SSD）をロード中... 最初だけ数秒かかります');
      const model = await cocoSsd.load({} as any);
      console.log('🤖 AI モデルのロードが完了しました。写真の物体検出を開始します。');
      const predictions = await model.detect(this.imageObj!);
      console.log('🤖 AI 解析生の検出結果:', predictions);
      const jockey = predictions.find(p => p.class === 'cup' || p.class === 'wine glass' || p.class === 'bottle');
      if (jockey && jockey.bbox) {
        const [x, y, width, height] = jockey.bbox;
        const scaleX = canvasWidth / this.imageObj!.width;
        const scaleY = canvasHeight / this.imageObj!.height;
        let   finalX = x * scaleX;
        let   finalY = y * scaleY;
        let   finalW = width * scaleX;
        let   finalH = height * scaleY;
        const aspectBoxRatio = finalW / finalH;
        console.log(`📊 AI検出枠の縦横比（横/縦）: ${aspectBoxRatio.toFixed(2)}`);
        if (jockey.class === 'cup' && aspectBoxRatio >= 0.65) {
          console.log('🍺 判定：取っ手ありの「居酒屋ビールジョッキ」です。自動補正と厚めモードを適用します。');
          this.glassType = 'thick';
          const handleWidthCompensation = finalW * 0.18; 
          finalW = finalW - handleWidthCompensation;
          console.log(`🔧 取っ手幅（約${Math.round(handleWidthCompensation)}px）をカットしました。`);
        } else {
          console.log('🥛 判定：取っ手のない「通常のコップ・グラス」です。100%の幅で薄めモードを適用します。');
          // ガラスの厚みを「薄め（thin = 20%引き）」にし、AIの検出枠幅を削らずにそのまま使います
          this.glassType = 'thin';
        }
        this.points = [
          { x: finalX,          y: finalY },          // 0: 左上
          { x: finalX + finalW, y: finalY },          // 1: 右上
          { x: finalX + finalW, y: finalY + finalH }, // 2: 右下
          { x: finalX,          y: finalY + finalH }  // 3: 左下
        ];
        console.log('🎉 AI ＋ エッジ補正が完了しました！自動ピン配置:', this.points);
      } else {
        console.log('⚠️ AIが写真からコップの輪郭を特定できませんでした。手動の初期位置を維持します。');
      }
      this.drawCanvas();
      this.calculateVolume();
      this.isAILoading = false;
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error) || String(error);
      console.error('❌ TensorFlow AI自動推定中に深刻なエラーが発生しました。理由:', errorMsg);
      this.isAILoading = false;
    }
  }

  public onTouchStart(ev: any) {
    if (!this.imageSrc) return;
    const touch = ev.touches[0];
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    const hitRadius = 30; 
    
    let foundPointIndex = -1;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const distance = Math.sqrt(Math.pow(touchX - p.x, 2) + Math.pow(touchY - p.y, 2));
      if (distance < hitRadius) {
        foundPointIndex = i;
        break; 
      }
    }
    
    this.selectedPointIndex = foundPointIndex;
    this.isManualFoamAdjust = false; // 一度リセット

    if (foundPointIndex !== -1) {
      if (ev.cancelable) ev.preventDefault();
      this.isManualFit = true;
    } else {
      // 💡 4隅の点にヒットしなかった場合、緑の線（泡底ライン）に触れたかを判定する
      const pTopLeft = this.points[0];
      const pBottomLeft = this.points[3];
      const totalPixelHeight = Math.abs(pBottomLeft.y - pTopLeft.y);

      if (totalPixelHeight > 0 && this.foamRatio !== null) {
        // 現在の緑の線のY座標を計算
        const foamPercent = this.foamRatio / 100;
        const currentBoundaryY = pTopLeft.y + (totalPixelHeight * foamPercent);

        // 指のY座標が、緑の線の上下30ピクセル以内、かつ左右の枠内に収まっているか
        if (Math.abs(touchY - currentBoundaryY) < 30 && touchX >= pTopLeft.x && touchX <= this.points[1].x) {
          this.isManualFoamAdjust = true;
          if (ev.cancelable) ev.preventDefault();
          console.log('🟢 [Manual] 泡底ラインのタッチを検知。手動調整モードに入ります。');
        }
      }
    }
    this.cdr.detectChanges();
  }
  public onTouchMove(ev: any) {
    if (!this.imageSrc) return;
    const touch = ev.touches[0];
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    let touchX = touch.clientX - rect.left;
    let touchY = touch.clientY - rect.top;

    if (touchX < 0) touchX = 0;
    if (touchX > rect.width) touchX = rect.width;
    if (touchY < 0) touchY = 0;
    if (touchY > rect.height) touchY = rect.height;

    // 💡 1. 4隅の赤い点を移動させている場合（既存の処理）
    if (this.selectedPointIndex !== -1) {
      if (ev.cancelable) ev.preventDefault();
      this.points[this.selectedPointIndex] = { x: touchX, y: touchY };
      this.drawCanvas();
      this.calculateVolume();
      return;
    }
    // 💡 2. 【追加】緑の線（泡底）を移動させている場合
    if (this.isManualFoamAdjust) {
      if (ev.cancelable) ev.preventDefault();
      const pTopLeft = this.points[0];
      const pBottomLeft = this.points[3];
      
      // 赤い枠線から指がはみ出さないようにガード
      if (touchY < pTopLeft.y) touchY = pTopLeft.y;
      if (touchY > pBottomLeft.y) touchY = pBottomLeft.y;

      const totalPixelHeight = pBottomLeft.y - pTopLeft.y;
      if (totalPixelHeight > 0) {
        // 現在の指の高さが全体の何％にあたるかを逆算（0.0 〜 1.0）
        const currentProgress = (touchY - pTopLeft.y) / totalPixelHeight;
        
        // 0〜100の整数に丸めて foamRatio を直接上書き更新
        let calculatedRatio = Math.round(currentProgress * 20) * 5;
        if (calculatedRatio < 5) calculatedRatio = 5;
        if (calculatedRatio > 95) calculatedRatio = 95;
        this.foamRatio = calculatedRatio;
        this.beerRatio = 100 - this.foamRatio;

        // 💡 4隅は動いていないが、泡底は動くのでcalculateVolume()を実施
        this.calculateVolume();
        this.drawCanvas(); 
        this.cdr.detectChanges();
      }
    }
  }
  public calculateVolume() {
    if (!this.points || this.points.length < 4 || !this.realHeight) {
      this.estimatedVolume = null;
      this.estimatedLiquidVolume = null;
      return;
    }
    // ① まずは容器全体の容量を計算
    const finalVolume = this.executeVolumeCalculation(this.points, this.realHeight);
    this.estimatedVolume = finalVolume !== null ? Math.round(finalVolume) : null;
    if (finalVolume !== null && this.foamRatio !== null) {
      const foamPercent = this.foamRatio / 100;

      // 泡底（緑の線）の左右の端の座標を、foamRatio を使って線形補間（内分点）で割り出す
      const pTopLeft     = this.points[0];
      const pTopRight    = this.points[1];
      const pBottomRight = this.points[2];
      const pBottomLeft  = this.points[3];

      // 泡底の左端と右端の座標を計算
      const foamLeft = {
        x: pTopLeft.x + (pBottomLeft.x - pTopLeft.x) * foamPercent,
        y: pTopLeft.y + (pBottomLeft.y - pTopLeft.y) * foamPercent
      };
      const foamRight = {
        x: pTopRight.x + (pBottomRight.x - pTopRight.x) * foamPercent,
        y: pTopRight.y + (pBottomRight.y - pTopRight.y) * foamPercent
      };

      // 液体部分（ビール）だけの仮想の4隅の点を作成
      const liquidPoints = [
        foamLeft,     // 新しい左上（泡底の左）
        foamRight,    // 新しい右上（泡底の右）
        pBottomRight, // 元の右下
        pBottomLeft   // 元の左下
      ];

      // 液体部分の実際の高さ (全体から泡の割合を引いた残り)
      const liquidRealHeight = this.realHeight * (1 - foamPercent);

      // 共通ロジックに流し込んで液体体積を計算
      const liquidVolume = this.executeVolumeCalculation(liquidPoints, liquidRealHeight);
      this.estimatedLiquidVolume = liquidVolume !== null ? Math.round(liquidVolume) : null;
    } else {
      this.estimatedLiquidVolume = null;
    }
    // 7. 保存と更新
    this.calculateBeerFoamRatio();
    this.cdr.detectChanges(); 
  }
  private executeVolumeCalculation(points: {x: number, y: number}[], currentRealHeight: number): number | null {

    const pTopLeft     = points[0];
    const pTopRight    = points[1];
    const pBottomRight = points[2];
    const pBottomLeft  = points[3];

    const angleTop = Math.atan2(pTopRight.y - pTopLeft.y, pTopRight.x - pTopLeft.x);
    
    // 下辺（左下から右下）の傾き角度も同様に取得し、上下の平均傾き角度を決定
    const angleBottom = Math.atan2(pBottomRight.y - pBottomLeft.y, pBottomRight.x - pBottomLeft.x);
    const angle = (angleTop + angleBottom) / 2; // ジョッキ全体の傾き角度（θ）

    // 💡 2. 傾き角度（θ）のコサインとサインを取得
    const cosTheta = Math.abs(Math.cos(angle));
    if (cosTheta === 0) return null; // 90度真横になってしまう場合のエラー回避

    // 💡 3. 【最重要】回転補正（座標系を真っ直ぐに戻す計算）
    // 三平方の定理で斜辺の長さを取りつつ、推定した傾き角度で補正をかけることで、
    // 「ジョッキを完全に垂直に直したとき」の本来のピクセル幅・高さを正確に復元します
    const rawHeightLeft  = Math.sqrt(Math.pow(pBottomLeft.x - pTopLeft.x, 2) + Math.pow(pBottomLeft.y - pTopLeft.y, 2));
    const rawHeightRight = Math.sqrt(Math.pow(pBottomRight.x - pTopRight.x, 2) + Math.pow(pBottomRight.y - pTopRight.y, 2));
    // 垂直方向の真のピクセル高さ h
    const avgPixelHeight = ((rawHeightLeft + rawHeightRight) / 2) * cosTheta;

    const rawWidthTop    = Math.sqrt(Math.pow(pTopRight.x - pTopLeft.x, 2) + Math.pow(pTopRight.y - pTopLeft.y, 2));
    const rawWidthBottom = Math.sqrt(Math.pow(pBottomRight.x - pBottomLeft.x, 2) + Math.pow(pBottomRight.y - pBottomLeft.y, 2));
    // 水平方向の真のピクセル直径（上・下）
    const pixelWidthTop    = rawWidthTop * cosTheta;
    const pixelWidthBottom = rawWidthBottom * cosTheta;

    if (avgPixelHeight === 0) return null;

    // 4. 上下の実際の半径（r1, r2）を別々に逆算（ここからは既存の円錐台ロジックと同じ）
    const realDiameterTop    = (pixelWidthTop / avgPixelHeight) * currentRealHeight;
    const realDiameterBottom = (pixelWidthBottom / avgPixelHeight) * currentRealHeight;
    
    const r1 = realDiameterTop / 2;    // 上の半径
    const r2 = realDiameterBottom / 2; // 下の半径

    // 5. 円錐台の体積公式
    const rawVolume = (1 / 3) * Math.PI * currentRealHeight * (Math.pow(r1, 2) + (r1 * r2) + Math.pow(r2, 2));

    // 6. ガラスの厚み補正（セグメント連動）
    let glassThicknessCompensation  = 1 - this.glassCompThin;
    if (this.glassType === 'thick') {
      glassThicknessCompensation    = 1 - this.glassCompThick;
    }
    return rawVolume * glassThicknessCompensation;
  }
  private drawCanvas(){
    if (!this.canvas || !this.imageObj) return;
    const canvasEl = this.canvas.nativeElement;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(this.imageObj, 0, 0, canvasEl.width, canvasEl.height);
    if (this.points.length === 4) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      // 右上、右下、左下、そして左上へと線を結ぶ
      ctx.lineTo(this.points[1].x, this.points[1].y);
      ctx.lineTo(this.points[2].x, this.points[2].y);
      ctx.lineTo(this.points[3].x, this.points[3].y);
      ctx.closePath();
      // 線の見た目を設定（半透明の赤、太さ3ピクセル）
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';ctx.lineWidth = 3;ctx.stroke();
      // 枠線の内側を薄い赤で塗りつぶす（ジョッキの範囲をわかりやすくするため）
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fill();
      //---
      const pTopLeft = this.points[0];
      const pBottomLeft = this.points[3];
      const totalPixelHeight = Math.abs(pBottomLeft.y - pTopLeft.y);
      if (totalPixelHeight > 0 && this.realHeight > 0) {
        const pxPerCmDynamic = totalPixelHeight / this.realHeight;
        ctx.fillStyle = '#ff3b30';
        ctx.strokeStyle = 'rgba(255, 59, 48, 0.7)';
        ctx.font = 'bold 11px Arial';
        ctx.textBaseline = 'middle';
        for (let cm = 0; cm <= this.realHeight; cm++) {
          const tickY = pTopLeft.y + (cm * pxPerCmDynamic);
          const tickX = pTopLeft.x;
          ctx.beginPath();
          ctx.moveTo(tickX, tickY);
          ctx.lineTo(tickX - 10, tickY);
          ctx.lineWidth = 2;
          ctx.stroke();
          if (cm % 5 === 0 || cm === this.realHeight) {
            ctx.fillText(cm + 'cm', tickX - 35, tickY);
          }
        }
        if (this.foamRatio !== null && this.beerRatio !== null) {
          const foamPercent = this.foamRatio / 100;
          const boundaryY = pTopLeft.y + (totalPixelHeight * foamPercent);
          const boundaryCm = (this.realHeight * foamPercent).toFixed(1);
          ctx.beginPath();
          ctx.moveTo(this.points[0].x, boundaryY);
          ctx.lineTo(this.points[1].x, boundaryY);
          ctx.strokeStyle = '#34c759'; 
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#34c759';
          ctx.font = 'bold 10px Arial';
          ctx.fillText('泡底:' + boundaryCm + 'cm', this.points[0].x + 5, boundaryY - 8);
        }
      }
      //---
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        ctx.beginPath();
        // 半径8ピクセルの円を描く
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        // 丸の内側を真っ赤に塗りつぶす
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        // 丸の輪郭を白線で囲む（写真の上でも見やすくするため）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;ctx.stroke();
      }
    }
  }
  private drawModalCanvas(targetHeight:number){
    if (!this.modalCanvas || !this.imageObj) return;
    const mainCanvasEl = this.canvas.nativeElement;       // 元の画面のCanvas
    const modalCanvasEl = this.modalCanvas.nativeElement; // モーダル内のCanvas
    const ctx = modalCanvasEl.getContext('2d');
    if (!ctx) return;

    const inverseAspectRatio = mainCanvasEl.width / mainCanvasEl.height;
    const targetHeightCorr:number = targetHeight <300  ? 300 : targetHeight;
    modalCanvasEl.height  = targetHeightCorr;
    modalCanvasEl.width   = targetHeightCorr * inverseAspectRatio;
    modalCanvasEl.style.height = `${modalCanvasEl.height}px`;
    modalCanvasEl.style.width = `${modalCanvasEl.width}px`;
    ctx.clearRect(0, 0, modalCanvasEl.width, modalCanvasEl.height);
    ctx.drawImage(this.imageObj, 0, 0, modalCanvasEl.width, modalCanvasEl.height);

    const scale = modalCanvasEl.height / mainCanvasEl.height;
    if (this.points.length === 4) {
      const p0x = this.points[0].x * scale; const p0y = this.points[0].y * scale;
      const p1x = this.points[1].x * scale; const p1y = this.points[1].y * scale;
      const p2x = this.points[2].x * scale; const p2y = this.points[2].y * scale;
      const p3x = this.points[3].x * scale; const p3y = this.points[3].y * scale;
      ctx.beginPath();
      ctx.moveTo(p0x, p0y);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3 * scale; 
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fill();
      const totalPixelHeight = Math.abs(p3y - p0y); // 縮小後の高さから計算
      if (totalPixelHeight > 0 && this.foamRatio !== null) {
        const foamPercent = this.foamRatio / 100;
        const boundaryY = p0y + (totalPixelHeight * foamPercent);

        ctx.beginPath();
        ctx.moveTo(p0x, boundaryY);
        ctx.lineTo(p1x, boundaryY);
        ctx.strokeStyle = '#34c759'; 
        ctx.lineWidth = 2 * scale; // 💡 点線の太さも連動
        ctx.setLineDash([4 * scale, 4 * scale]); // 💡 点線の間隔も連動
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (let i = 0; i < this.points.length; i++) {
        // その点の縮小後の座標を計算
        const px = this.points[i].x * scale;
        const py = this.points[i].y * scale;

        ctx.beginPath();
        // 💡 丸の半径（8ピクセル）も縮小率に連動させて小さくします
        ctx.arc(px, py, 8 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        // 💡 白い輪郭の太さも連動
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale; 
        ctx.stroke();
      }
    }
  }
  public clearModalCanvas(): void {
    if (!this.modalCanvas) return;
    const canvasEl = this.modalCanvas.nativeElement;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    // 💡 Canvasの全画面をクリアして透明（または真っ白）にします
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    
    // 💡 念のためCanvasの解像度サイズも0にしてリセットしておくとより安全です
    canvasEl.width = 0;
    canvasEl.height = 0;

    console.log('🧹 [Modal] 残像を防ぐため、モーダル内のCanvasを完全にクリアしました。');
    this.cdr.detectChanges();
  }
  public calculateBeerFoamRatio() {
    // 💡 【最重要追加】手動で調整された後は、自動エッジ検出の再計算を行わせず、手動の位置を100%最優先してキープします
    if (this.isManualFoamAdjust) return;

    if (!this.canvas || !this.imageObj || this.points.length < 4) return;
    const canvasEl = this.canvas.nativeElement;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const pTL = this.points[0]; // 左上
    const pTR = this.points[1]; // 右上
    const pBR = this.points[2]; // 右下
    const pBL = this.points[3]; // 左下

    const yMin = Math.min(pTL.y, pTR.y);
    const yMax = Math.max(pBL.y, pBR.y);
    const height = Math.floor(yMax - yMin);
    
    // フチ切り捨て（5%）を適用
    const edgeMargin = Math.floor(height * 0.05);
    const safeYMin = yMin + edgeMargin;

    const fullWidth = canvasEl.width;
    
    console.log('📊 [BeerAnalysis] === エッジ検出スキャン開始 ===');

    try {
      const imgData = ctx.getImageData(0, 0, fullWidth, canvasEl.height);
      const data = imgData.data;

      // 各行の「ビールの鮮やかさスコア」を記録する配列
      const rowScores: number[] = [];
      const yCoordinates: number[] = [];

      // 1. 縦軸（Y軸）を1行ずつスキャンして、行ごとの「ビールの特徴度」を計算
      for (let y = Math.floor(safeYMin); y < yMax; y += 2) {
        const pct = (y - yMin) / (yMax - yMin);
        const leftX = pTL.x + (pBL.x - pTL.x) * pct;
        const rightX = pTR.x + (pBR.x - pTR.x) * pct;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let x = Math.floor(leftX); x < rightX; x += 4) {
          const index = (y * fullWidth + x) * 4;
          if (index < 0 || index >= data.length) continue;

          totalR += data[index];
          totalG += data[index + 1];
          totalB += data[index + 2];
          count++;
        }

        if (count > 0) {
          const avgR = totalR / count;
          const avgG = totalG / count;
          const avgB = totalB / count;

          // 💡 ビール特有の「赤と緑の差が大きく、青が暗い」度合いをスコア化
          // 本物のビール層に入ると、このスコアが急上昇します
          const beerScore = (avgR - avgG) + (avgR - avgB);
          rowScores.push(beerScore);
          yCoordinates.push(y);
        }
      }

      // 💡 2. 【最重要】隣り合う行のスコアの「差分（ギャップ）」を計算し、最も変化が激しい場所を探す
      let maxGap = -1;
      let boundaryRowIndex = -1;

      // 誤検知防止のため、上端20pxと下端20pxはスキャンから除外
      const ignoreRange = 10; 

      for (let i = ignoreRange; i < rowScores.length - ignoreRange; i++) {
        // 現在の行から数行先にかけて、どれくらいスコアが急変化したか（色の落差）
        const gap = rowScores[i + 5] - rowScores[i]; 

        if (gap > maxGap) {
          maxGap = gap;
          boundaryRowIndex = i + 2; // 変化の中間を境界とする
        }
      }

      // 3. 比率の最終計算
      if (boundaryRowIndex !== -1 && rowScores.length > 0) {
        // 全体の高さに対する位置の割合
        const ratio = boundaryRowIndex / rowScores.length;
        this.foamRatio = Math.round(ratio * 20) *5;
        
        // 最低限の安全ガード
        if (this.foamRatio < 5) this.foamRatio = 5;
        if (this.foamRatio > 95) this.foamRatio = 95;
        
        this.beerRatio = 100 - this.foamRatio;
        console.log(`🎯 [BeerAnalysis] エッジ検出成功！ 境界インデックス: ${boundaryRowIndex} -> 泡比率=${this.foamRatio}, ビール比率=${this.beerRatio}`);
      } else {
        this.foamRatio = 30;
        this.beerRatio = 70;
        console.log(`❌ [BeerAnalysis] 境界が特定できずデフォルト(3:7)`);
      }

    } catch (e) {
      console.error('❌ [BeerAnalysis] エラー発生:', e);
    }
    console.log('📊 [BeerAnalysis] === 解析終了 ===');
  }



  //===========================================================================
}
