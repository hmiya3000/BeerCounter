import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonGrid, IonRow, IonCol } from "@ionic/angular/standalone";
import { Router } from '@angular/router';
import { DebugService } from '../../service/debug-service';
import { AppmodeService } from '../../service/features/appmode-service';
import { WindowService } from '../../service/window-service';
import { Nav } from '../../../app/utils/util';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, CommonModule,IonItem,IonLabel]
})
export class DebugComponent {
  public readonly Nav = Nav;
  constructor(
    public router: Router,
    public  debugSvc: DebugService,
    private appmodeSvc: AppmodeService,
    private windowSvc: WindowService
  ) { }
  //===========================================================================
  public get strExpireDate(): string {
    const  _numExpireDate = this.windowSvc.getExpireTime();
    if (_numExpireDate == 0){
      return '報酬獲得';
    } else {
      const dateText = new Date(_numExpireDate).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit'});
      return dateText
    }
  }
  public get hasAdReward(): boolean {
    const  _numExpireDate = this.windowSvc.getExpireTime();
    return _numExpireDate != 0;
  }
  public get modeName(): string {
    return this.appmodeSvc.getModeInfo().name;
  }
  public get isAppWithAd(): boolean {
    return this.appmodeSvc.info().withAd;
  }
  public get hasTokenDropbox() : boolean {
//    return this.dropboxSvc.hasToken();
    return false;
  }
}
