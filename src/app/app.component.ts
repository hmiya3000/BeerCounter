import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
//---
import { DebugService } from './service/infra/debug-service';
import { WindowService } from './service/infra/window-service';
import { FeatureService } from './service/features/feature-service';
//---
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(
    private featureSvc: FeatureService,
    private debugSvc: DebugService,
    private windowSvc: WindowService,
  ) {}
  async ngOnInit() {
    console.log('=== app.component ngOnInit()...start!');
    this.featureSvc.readBackup();
    this.debugSvc.readBackup();
    this.windowSvc.readBackup();
    await this.windowSvc.initialize( this.featureSvc.withAd, this.debugSvc.isAdTestMode() );
    await this.featureSvc.initialize();
    console.log('=== app.component ngOnInit()...finish!');
  }
  ngOnDestroy(){
    this.windowSvc.finalize();
    this.featureSvc.finalize();
  }
  //===========================================================================
}