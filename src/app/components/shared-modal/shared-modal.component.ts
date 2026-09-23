import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { IonModal, IonPopover  } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { caretBackOutline, caretForwardOutline } from 'ionicons/icons';
import { SwipeLayoutComponent } from '../swipe-layout/swipe-layout.component'; // パスは環境に合わせて調整してください

export interface HeaderResult {
  dir: number;
}

@Component({
  selector: 'app-shared-modal',
  templateUrl: './shared-modal.component.html',
  styleUrls: ['./shared-modal.component.scss'],
  standalone: true,
  imports: [IonModal, SwipeLayoutComponent ]
})
export class SharedModalComponent {

  @Input() isOpen: boolean              = false;
  @Input() headerTitle: string          = '設定';
  @Input() showConfirmButton: boolean   = true;
  @Input() isBackButton: boolean        = false;
  @Input() isForwardButton: boolean     = false;
  @Input() isScrollEnabled: boolean     = true; 

  @Input() confirmButtonText: string = '設定';
  @Input() cancelButtonText: string = 'キャンセル';

  @Input() breakpoints?: number[];
  @Input() initialBreakpoint?: number;

  @Input() targetPopover!: IonPopover;

  @Output() onConfirm           = new EventEmitter<void>();
  @Output() onCancel            = new EventEmitter<void>();
  @Output() ionModalDidPresent  = new EventEmitter<void>();
  @Output() headerClick         = new EventEmitter<any>();
  @Output() pageSwipe           = new EventEmitter<any>();

  constructor(
  ){
  }
  public closeModal(): void {
    this.onCancel.emit();
  }
  public confirmModal(): void {
    this.onConfirm.emit();
  }
  public onModalPresent(): void {
    this.ionModalDidPresent.emit();
  }
}
