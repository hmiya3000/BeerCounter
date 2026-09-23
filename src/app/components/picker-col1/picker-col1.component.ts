import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption,IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';

export interface PickerOptionItem {
  text: string;
  value: any;
}
export interface PickerCol1Result {
  col0: any;
}
@Component({
  selector: 'app-picker-col1', // 🌟 1列専用のクリーンな識別タグ名です！
  templateUrl: './picker-col1.component.html',
  styleUrls: ['./picker-col1.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, 
    IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonGrid, IonRow, IonCol
  ]
})
export class PickerCol1Component implements OnInit {

  @Input() isInline: boolean = false;

  @Input() sizeCol0: number | 'auto' = 12;

  @Input() isOpen: boolean = false;
  @Input() headerTitle: string = '選択設定';

  @Input() optionsCol0: PickerOptionItem[] = [];
  @Input() selectedValueCol0: any;

  @Output() onConfirm     = new EventEmitter<any>();
  @Output() onCancel      = new EventEmitter<void>();
  @Output() onCol0Change  = new EventEmitter<any>();

  public pickerInitialBreakpoint: number | undefined = 0.35;
  public pickerBreakpoints: number[] | undefined = [0, 0.35];
  public activeOptions: PickerOptionItem[] = [];
  //===========================================================================
  constructor(
    private platform: Platform,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit() {
    if (this.platform.is('tablet')) {
      this.pickerInitialBreakpoint = undefined;
      this.pickerBreakpoints = undefined;
    }    
  }
  //===========================================================================
  public onModalDidPresent(): void {
    // 開ききってから、親から渡された1,200件を流し込む
    this.activeOptions = this.optionsCol0;
    this.cdr.detectChanges(); // 画面に即座に反映
  }
  public onModalWillDismiss(): void {
    // 閉じる瞬間に、1,200件のデータを空っぽにしてDOMを消滅させる
    this.activeOptions = [];
    this.cdr.detectChanges();
    
    this.onCancel.emit();
  }  
  //===========================================================================
  public onPickerCol0Change(event: any): void {
    // 🍏 ドラムが回った際の最新値を自分自身の変数に確実に反映させます
    this.selectedValueCol0 = event.detail.value;
    
    this.onCol0Change.emit(this.selectedValueCol0);
    if (this.isInline) {
      this.emitInlineResult();
    }    
  }
  private emitInlineResult(): void {
    const inlineResult: PickerCol1Result = {
      col0: this.selectedValueCol0
    };
    this.onConfirm.emit(inlineResult);
  }
  public confirmPicker(): void {
    const finalResult: PickerCol1Result = {
      col0: this.selectedValueCol0,
    };
    this.activeOptions = []; // 🌟 クリア
    this.cdr.detectChanges();
    this.onConfirm.emit(finalResult);
  }
  //===========================================================================
}