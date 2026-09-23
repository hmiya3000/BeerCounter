import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle ,IonIcon, IonLabel, IonContent, IonItem } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { caretBackOutline, caretForwardOutline } from 'ionicons/icons';

export interface HeaderResult {
  dir: number;
}

@Component({
  selector: 'app-swipe-layout',
  templateUrl: './swipe-layout.component.html',
  styleUrls: ['./swipe-layout.component.scss'],
  imports: [IonContent, IonIcon, IonLabel, IonLabel, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle ]
})
export class SwipeLayoutComponent {

  @Input() headerTitle: string = '';
  @Input() cancelButtonText: string = '戻る';
  @Input() confirmButtonText: string = '確定';
  @Input() showConfirmButton: boolean = false;
  @Input() isBackButton: boolean      = false;
  @Input() isForwardButton: boolean   = false;
  @Input() isDisplay: boolean         = true;
  @Input() isScrollEnabled: boolean   = true;

  @Output() onCancel            = new EventEmitter<void>();
  @Output() onConfirm           = new EventEmitter<void>();
  @Output() headerClick         = new EventEmitter<any>();
  @Output() pageSwipe           = new EventEmitter<any>();

  private touchStartX: number = 0;
  private touchStartY: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
  ){
    addIcons({caretBackOutline,caretForwardOutline});
  }

  public onHeaderItemClick(): void {
    const result: HeaderResult = {
      dir: 0
    };    
    this.headerClick.emit(result);
  }
  public onHeaderBack(): void {
    const result: HeaderResult = {
      dir: -1
    };    
    this.headerClick.emit(result);
    this.triggerPageFlipAnimation();
  }
  public onHeaderForward(): void {
    const result: HeaderResult = {
      dir: 1
    };    
    this.headerClick.emit(result);
    this.triggerPageFlipAnimation();
  }
  public onTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.no-swipe')) {
      this.touchStartX = 0;
      this.touchStartY = 0;
      return; // ここで処理を中断
    }
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }
  public onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].screenX;
    const touchEndY = event.changedTouches[0].screenY;
    const diffX = touchEndX - this.touchStartX;
    const diffY = touchEndY - this.touchStartY;
    const minSwipeDistance = 60;
    if (Math.abs(diffX) > Math.abs(diffY) && diffX < -minSwipeDistance) {
      if (this.isForwardButton){
        const result: HeaderResult = {
          dir: 1
        };    
        this.pageSwipe.emit(result);
        this.triggerPageFlipAnimation();
      }
    } else if (Math.abs(diffX) > Math.abs(diffY) && diffX > minSwipeDistance) {
      if (this.isBackButton){
        const result: HeaderResult = {
          dir: -1
        };    
        this.pageSwipe.emit(result);
        this.triggerPageFlipAnimation();
      }
    }
  }
  private triggerPageFlipAnimation(): void {
    this.isDisplay = false;
    this.cdr.detectChanges(); // 一瞬だけ消滅させる

    this.isDisplay = true;
    this.cdr.detectChanges(); // 新しい日付データを持った状態で再マウント（右からシュッと滑り込む！）
  }
}