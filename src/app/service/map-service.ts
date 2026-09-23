import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { DEF } from '../config/default-constants';
import { GEO_CONFIG } from '../config/device-constants';
import { GoogleMap } from '@capacitor/google-maps';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {

  public event$ = new Subject<{ lat: number; lng: number }>();

  private googleApiKey = GEO_CONFIG._googleApiKey;
  private map!: GoogleMap;
  private activeMarkerIds: string[] = [];
  private currentMarkerId: string | null = null; // 現在立っているピンの管理用
  private activeCircleIds: string[] = [];
  private circleIds: string[] = [];

  //===========================================================================
  public async createEmbeddedMap(mapElement: HTMLElement,lat: number, lng: number) {
    if (!mapElement) {
      console.error('[Map] 地図のHTML要素がまだ見つかりません。');
      return;
    }
    console.log('[Map]createEmbeddedMap(',lat,lng)
    try {
      await this.initMap(mapElement, lat,lng);
      await this.map.setOnMapClickListener(async (params) => {
        const clickedLat = params.latitude;
        const clickedLng = params.longitude;
        console.log('[Map] 地図がタップされました。座標:', clickedLat, clickedLng);
        this.event$.next({ lat: clickedLat, lng: clickedLng });
      });
    } catch (e) {
      console.error('[Map] 描画エラー:', e);
    }
  }
  private async initMap(mapElement: HTMLElement, lat: number, lng: number) {
    try {
      // サービス側で安全にGoogleMapを組み立てます
      this.map = await GoogleMap.create({
        id: 'my-cool-map',
        element: mapElement, // 引き渡された本物のHTML要素をドロップ
        apiKey: this.googleApiKey,
        config: {
          center: { lat: lat, lng: lng },
          zoom: 17,
        },
      });
      console.log('[Map] サービスの内部で地図の初期描画に完全成功しました。');      
    } catch (e) {
      console.error('[Map] 地図の描画エラー:', e);
    }
  }
  //===========================================================================
  public async moveMapToLocation(lat: number, lng: number) {
    try {
      // 💡 1. 地図オブジェクト（this.map）がまだ初期化されていない場合は処理を中断します
      if (!this.map) {
        console.warn('[Map] 地図オブジェクトが準備できていないため移動できません。');
        return;
      }
      console.log('[Map] カメラを指定位置に移動します。座標:', lat, lng);
      // 💡 2. setCamera機能を使い、中心座標とズーム率を一発で書き換えます
      await this.map.setCamera({
        coordinate: {
          lat: lat, // 新しい移動先の緯度
          lng: lng  // 新しい移動先の経度
        },
        zoom: 17,      // 💡 移動した後の拡大率（お好みに合わせて15〜17等に指定）
        animate: true  // 💡 trueにすると、現在の位置からスーッと滑らかにスライド移動します
      });
      console.log('[Map] カメラの移動が完了しました。');
    } catch (error) {
      console.error('[Map] カメラの移動中にエラーが発生しました:', error);
    }
  }
  //===========================================================================
  public async dropMarkerOnMap(lat: number, lng: number, titleStr: string = '選択された位置') {
    try {
      if (!this.map) {
        console.warn('[Map] 地図オブジェクトが準備できていないためピンを立てられません。');
        return;
      }
      // 💡 2. すでに古いピンが画面に残っている場合は、先にそれを完全に消去します
      if (this.currentMarkerId) {
        console.log('[Map] 古いピンを消去します。ID:', this.currentMarkerId);
        await this.map.removeMarker(this.currentMarkerId);
        this.currentMarkerId = null;
      }
      console.log('[Map] 指定位置に新しいピンを配置します。座標:', lat, lng);
      // 💡 3. バージョンによるプロパティ名（coordinate / center / position）のブレを100%完全攻略するため、
      // 可能性のあるプロパティ名をすべて網羅したオブジェクトを「as any」で定義します。
      const markerConfig: any = {
        coordinate: { lat: lat, lng: lng },
        center: { lat: lat, lng: lng },
        position: { lat: lat, lng: lng },
        latitude: lat,
        longitude: lng,
        title: titleStr, // ピンをタップした際に出る文字
        snippet: 'ここに決定しました' // 補足テキスト
      };
      await this.clearAllMarkers();
      const responseMarkerId = await this.map.addMarker(markerConfig as any);
      
      if (responseMarkerId) {
        this.activeMarkerIds.push(responseMarkerId);
        this.currentMarkerId = responseMarkerId;
        console.log('[Map] 新しいピンの設置に成功しました。保存ID:', this.currentMarkerId);
      }
    } catch (error) {
      console.error('[Map] ピンの設置中に重大なエラーが発生しました:', error);
    }
  }
  public async clearMarkerFromMap(){
    if (this.currentMarkerId) {
      console.log('[Map] 古いピンを消去します。ID:', this.currentMarkerId);
      await this.map.removeMarker(this.currentMarkerId);
      this.currentMarkerId = null;
    }
  }
  public async clearAllMarkers() {
    if (!this.map) return;
    try {
      console.log('[Map] マップ上のマーカーの完全消去を開始します...');
      if (this.activeMarkerIds.length > 0) {
        await Promise.all(
          this.activeMarkerIds.map(id => this.map.removeMarker(id ))
        );
        console.log(`[Map] 管理されていたピンを削除しました。件数: ${this.activeMarkerIds.length}`);
      }
      // await this.map.removeMarkers(this.activeMarkerIds); 

    } catch (error) {
      console.error('[Map] マップマーカーの消去中にエラーが発生しました:', error);
    } finally {
      // 💡 対策3: 処理が成功してもエラーになっても、管理リストを空にする
      this.activeMarkerIds = [];
      this.currentMarkerId = null; // 既存の1つ用変数もクリア
    }
  }
  //===========================================================================
  public async drawCircleOnMap(lat: number, lng: number, radiusMeter: number) {
    try {
      if (!this.map) {
        console.warn('[Map] 地図オブジェクトが準備できていないため円を描画できません。');
        return;
      }
      await this.clearCirclesFromMap();
      console.log('[Map] 指定位置に円を描画します。半径:', radiusMeter, 'm');
      const circleConfig: any = {
        center: { lat: lat, lng: lng },
        coordinate: { lat: lat, lng: lng },
        latitude: lat,
        longitude: lng,
        radius: radiusMeter,
        strokeColor: '#3880ff',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#a7a7a7',
        fillOpacity: 0.1
      };
      const resultIds = await this.map.addCircles([circleConfig as any]);
      if (resultIds && resultIds.length > 0) {
        this.activeCircleIds = [...resultIds]; 
        this.circleIds = resultIds; // 既存の変数への代入を維持
      }      
      console.log('[Map] 円の描画が完了しました。');
    } catch (error) {
      console.error('[Map] 円の描画中にエラーが発生しました:', error);
    }
  }
  public async clearCirclesFromMap() {
    if (!this.map) return;
    try {
      console.log('[Map] マップ上の円の完全消去を開始します...');
      if (this.activeCircleIds.length > 0) {
        await this.map.removeCircles(this.activeCircleIds);        
        console.log(`[Map] 円を削除しました。件数: ${this.activeCircleIds.length}`);
      }
    } catch (error) {
      console.error('[Map] 円の消去中にエラーが発生しました:', error);
    } finally {
      this.activeCircleIds = [];
      this.circleIds = []; // 既存の変数も念のため初期化
    }
  }
  //===========================================================================
  public async convertGeo( sharedUrl:string) : Promise<{isOk:boolean, latitude:number, longitude:number }> {
    try {
      console.log('[Map] 短縮URLの解析リクエストを開始します:', sharedUrl);
      const cleanUrl = sharedUrl.split('?')[0];
      console.log('[Map] 必要部分の抽出:', cleanUrl);

      const response = await CapacitorHttp.request({
        url: cleanUrl,
        method: 'HEAD', // 一度中身を読みにいきます
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        }
      });
      const longUrl = response.url;
      console.log('[Map] 展開されたURLの取得成功:', longUrl);
      if (longUrl && longUrl.includes('@')) {
        const match = longUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match && match[1] && match[2]) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          console.log('[Map:パターンA] 座標抽出成功！ lat:', lat, 'lng:', lng);
          return {isOk:true, latitude:lat, longitude:lng}
        }
      }
      if (longUrl){
        const urlObj = new URL(longUrl);
        const addressText = urlObj.searchParams.get('q') || '';   
        const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const geoResponse = await CapacitorHttp.request({
          url: geocodeUrl,
          method: 'GET',
          params: {
            address: addressText, // 展開された長いURLをそのまま住所としてGoogleに丸投げ
            key: GEO_CONFIG._googleApiKey
          }
        });
        if (geoResponse.status === 200 && geoResponse.data && geoResponse.data.status === 'OK') {
          const results = geoResponse.data.results;
          if (results && results.length > 0 && results[0].geometry && results[0].geometry.location) {
            // Googleのサーバーがftid等から正確に割り出したピンポイントの緯度経度
            const lat = results[0].geometry.location.lat;
            const lng = results[0].geometry.location.lng;
            
            console.log('[Map:パターンB] Google APIによる解読に成功！');
            console.log('・緯度 (lat):', lat);
            console.log('・経度 (lng):', lng);
            return {isOk:true, latitude:lat, longitude:lng}
          }
        }
      }
      console.warn('[Map] すべてのパターンで座標が特定できませんでした。');
    } catch (error) {
      console.error('[Map] 通信中にエラーが発生しました:', error);
    }
    console.log('[Map]東京駅の緯度経度を返す')
    return {isOk:false, latitude:DEF.LATITUDE, longitude:DEF.LONGITUDE}
  }
  //===========================================================================
  /**
   * 4. 【住所読み出し機能】座標（緯度経度）からGoogle公式APIを使って住所を特定する
   */
  public async readAddressFromLatLng(lat: number, lng: number) {
    try {
      // 💡 座標から住所を特定するための正しいAPIエンドポイント構造
      const reverseGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      console.log('[Map] 座標から住所の自動解読を開始します...');
      const response = await CapacitorHttp.request({
        url: reverseGeocodeUrl,
        method: 'GET',
        params: {
          latlng: lat + ',' + lng, // 💡 addressの代わりに latlng をカンマ結合で渡すのが公式仕様です
          key: this.googleApiKey,
          language: 'ja' // 必ず日本の住所形式で返してもらう指定
        }
      });
      if (response.status === 200 && response.data && response.data.status === 'OK') {
        const results = response.data.results;
        if (results && results.length > 0) {
          // Googleが解読した最も精度の高い正式な住所文字列（1件目）
          console.log('[Map]result:',results)
          const detectedAddress = results[0].formatted_address;
          // 💡 「日本、〒...」という文字が先頭に付くので、必要に応じてクレンジングします
          console.log('[Map] 立てたピンの住所の読み出しに成功しました！');
          console.log('👉 読み出された住所:', detectedAddress);
          // ここで画面の入力欄（変数の住所）に detectedAddress を自動代入して更新します
          const cleanedAddress = detectedAddress.replace(/^日本、\s*〒?\d{3}-\d{4}\s*/, '');
          return cleanedAddress;
        }
      }
      console.warn('[Map] 住所を特定できませんでした。status:', response.data?.status);
    } catch (error) {
      console.error('[Map] 通信中にエラーが発生しました:', error);
    }
    return null;
  }
  //===========================================================================
  public async openViewMap(lat: number, lng: number) {
    try {
      // 💡 1. 検索ではなく「ピンなし地図表示」を指定する専用のベースURLです
      const googleMapBase = 'https://www.google.com/maps/@?api=1&map_action=map&center=';
      
      // 💡 2. 拡大率17を指定する専用のパラメータです
      const zoomParam = '&z=17';

      // これらを寸分の狂いもなく順番に結合して、完全なURLを組み立てます
      const mapUrl = googleMapBase + lat + ',' + lng + zoomParam;

      console.log('[Map] Googleマップを開きます（ピンなし・拡大版）:', mapUrl);

      // 💡 3. CapacitorのBrowserプラグインで外部の地図を起動します
      await Browser.open({ url: mapUrl });

    } catch (error) {
      console.error('[Map] 地図の起動中にエラーが発生しました:', error);
    }
  }

  //===========================================================================
  public async addressToLatLng(address: string, isFree:boolean = true) : Promise<{isOk:boolean, latitude:number, longitude:number }> {
    if (isFree){
      return await this.addressToLatLngFreeGsi(address);
    } else {
      return await this.addressToLatLngPaidGoogle(address);
    }
  }
  //===========================================================================
  private async addressToLatLngFreeGsi(address: string) : Promise<{isOk:boolean, latitude:number, longitude:number }> {
    console.log('[Map]緯度経度を国土地理院APIで取得');
    try {
      const cleanAddress = address.trim();
      const fullApiUrl = 'https://msearch.gsi.go.jp/address-search/AddressSearch?q=' + encodeURIComponent(cleanAddress);
      console.log('【検証ステップ1】Web標準fetchで送信するURL:', fullApiUrl);
      const response = await window.fetch(fullApiUrl, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('【検証ステップ2】国土地理院からデータ受信成功:', data);
        if (data && data.length > 0 && data[0].geometry && data[0].geometry.coordinates) {
          const coordinates = data[0].geometry.coordinates;
          const lng = coordinates[0];
          const lat = coordinates[1];  
          if (lat && lng) {
            return {isOk:true, latitude:lat, longitude:lng}
          }
        }
      }
    } catch (error) {
      console.error('[Map] 座標変換中にエラーが発生しました。通常の住所検索に移行します:', error);
    }
    console.log('[Map]東京駅の緯度経度を返す')
    return {isOk:false, latitude:DEF.LATITUDE, longitude:DEF.LONGITUDE}
  }
  private async addressToLatLngPaidGoogle(address: string) : Promise<{isOk:boolean, latitude:number, longitude:number }> {
    console.log('[Map]緯度経度を有料Google APIで取得');
    try {
      const cleanAddress = address.trim();
      const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      const googleApiKey  = GEO_CONFIG._googleApiKey;
      const response = await CapacitorHttp.request({
        url: geocodeUrl,
        method: 'GET',
        params: {
          address: cleanAddress,
          key: googleApiKey
        }
      });
      // 💡 3. Googleから正常にデータが返ってきた場合
      if (response.status === 200 && response.data && response.data.status === 'OK') {
        const firstResult = response.data.results[0];
        if (firstResult && firstResult.geometry && firstResult.geometry.location) {
          const lat = firstResult.geometry.location.lat;
          const lng = firstResult.geometry.location.lng;
          console.log('[Map] Google APIで完璧な座標の特定に成功しました。緯度:', lat,',経度:', lng);
          return {isOk:true, latitude:lat, longitude:lng};
        }
      }
      console.warn('[Map] Google APIで座標が特定できませんでした。通常の住所検索に移行します。');
    } catch (error) {
      console.error('[Map] 通信エラーが発生しました。通常の住所検索に移行します:', error);
    }
    console.log('[Map]東京駅の緯度経度を返す')
    return {isOk:false, latitude:DEF.LATITUDE, longitude:DEF.LONGITUDE}
  }
  //===========================================================================
  public async openMapByAddressFreeGoogle(address: string, isPin:boolean ){
    let  mapUrl:string        = '';
    const cleanAddress = address.trim();
    const timestamp = new Date().getTime();
    if (isPin){
      console.log('[Map]住所を無料Google APIで指定');
      const queryText = `${cleanAddress}`;
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
    } else {
      console.log('[Map]住所付近をズーム');
      const queryText = `${cleanAddress}`;
      mapUrl = `https://www.google.com/maps/@?api=1&map_action=map&query=${encodeURIComponent(queryText)}&cb=${timestamp}`;
    }
    console.log('[Map]Googleマップ起動URL:', mapUrl);
    await Browser.open({ url: mapUrl });
  }
  public async openMapByAddressLatLng(address: string, isPin:boolean, isFree:boolean ) {
    console.log('[Map]住所を緯度経度に変換して指定');
    const retval  = await this.addressToLatLng(address, isFree );
    if (retval.isOk){
      let mapUrl:string = '';
      if (isPin){
        mapUrl = 'https://maps.google.com/maps/search/?api=1&query=' + retval.latitude + ',' + retval.longitude;
      } else {
        mapUrl = 'https://maps.google.com/maps/@?api=1&map_action=map&center=' + retval.latitude + ',' + retval.longitude + '&z=17';
      }
      console.log('[Map]Googleマップ起動URL:', mapUrl);
      await Browser.open({ url: mapUrl });
    } else {
      this.openMapByAddressFreeGoogle(address, isPin);
    }
  }
  public async openMapByLatLng(latitude:number, longitude:number, isPin:boolean){
    if (isPin){
      await this._openMapByLatLng(latitude, longitude);
    } else {
      await this._openMapByLatLngAround(latitude, longitude);
    }
  }
  private async _openMapByLatLng(latitude:number, longitude:number){
    const mapUrl = 'https://maps.google.com/maps/search/?api=1&query=' + latitude + ',' + longitude;
    console.log('[Map]Googleマップ起動URL:', mapUrl);
    await Browser.open({ url: mapUrl });
  }
  private async _openMapByLatLngAround(lat: number, lng: number) {
    console.log('[Map]緯度経度指定（ピンなし・拡大版)');
    try {
      const googleMapBase = 'https://www.google.com/maps/@?api=1&map_action=map&center=';
      const zoomParam = '&z=17';
      const mapUrl = googleMapBase + lat + ',' + lng + zoomParam;
      console.log('[Map]Googleマップ起動URL:', mapUrl);
      await Browser.open({ url: mapUrl });

    } catch (error) {
      console.error('[Map] 地図の起動中にエラーが発生しました:', error);
    }
  }

  //===========================================================================

}
