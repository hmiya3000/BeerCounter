import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {

  private version:string                  = '';
  private build:string                    = '';
  private modelName:string                = '';
  private androidVersion: number            = 0;
  private hasVersion:boolean              = false;
  private  _capacitor_getPlatform:string   = '';

  constructor(
  ) {
    this._capacitor_getPlatform = Capacitor.getPlatform();
  }
  public async initialize(){
    const res           = await this.getVer();
    this.version        = res.version;
    this.build          = res.build;
    this.modelName      = res.modelName;
    this.androidVersion = res.androidVersion;    
  }
  //===========================================================================
  private async getVer(): Promise<{ version:string, build:string, modelName:string, androidVersion: number}>{
    let _version        = '';
    let _build          = '';
    let _modelName      = '';
    let _androidVersion = 0;
    if (this.hasVersion){
      _version        = this.version;
      _build          = this.build;
      _modelName      = this.modelName;
      _androidVersion = this.androidVersion;
    } else {
      if ( this._capacitor_getPlatform === 'web'){
          _version          = 'X.X';
          _build            = '1';
          _modelName        = 'Web';
          _androidVersion   = 0;
          this.hasVersion   = true;
      } else {
        try {
          const ainfo       = await App.getInfo();
          _version          = ainfo.version;  // 1.2.3
          _build            = ainfo.build;      // 123
          const dinfo       = await Device.getInfo();
          _modelName        = dinfo.model; // 例: "iPhone16,1", "iPhone14,5" などが取得できます
          if (this._capacitor_getPlatform === 'android') {
            _androidVersion = parseInt(dinfo.osVersion, 10) || 0;
          }
          this.hasVersion   = true;
        } catch(e) {
          _version          = 'Error';
          _build            = '0';
          _modelName        = 'unknown'
          _androidVersion   = 0;
          this.hasVersion   = false;
        }
      }
    }
    return { version:_version, build:_build, modelName:_modelName, androidVersion:_androidVersion};
  }
  //===========================================================================
  public infoVer():{ version:string, build:string, modelName:string, strVer:string, androidVersion: number}{
    let _version        = '';
    let _build          = '';
    let _modelName      = '';
    let _strVer         = '...'
    let _androidVersion = 0;

    if (this.hasVersion){
      _version        = this.version;
      _build          = this.build;
      _modelName      = this.modelName;
      _androidVersion = this.androidVersion;
      _strVer         = this.version + '-' + this.build
    }
    return { version:_version, build:_build, modelName:_modelName, androidVersion:_androidVersion, strVer:_strVer};
  }
  //===========================================================================
}
