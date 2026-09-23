import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';

export interface PickerOptionItem {
  text: string;
  value: any;
}
export interface PickerCol2Result {
  col0: any;
  col1: any;
}
@Component({
  selector: 'app-picker-col2',
  templateUrl: './picker-col2.component.html',
  styleUrls: ['./picker-col2.component.scss'],
  standalone: true,
  imports: [
    IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, 
    IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonGrid, IonRow, IonCol
  ]
})
export class PickerCol2Component implements OnInit {

  @Input() isInline: boolean = false; 

  @Input() sizeCol0: number | 'auto' = 6; 
  @Input() sizeCol1: number | 'auto' = 6;

  @Input() isOpen: boolean = false;
  @Input() headerTitle: string = '選択設定';

  @Input() optionsCol0: PickerOptionItem[] = [];
  @Input() selectedValueCol0: any;

  @Input() optionsCol1: PickerOptionItem[] = [];
  @Input() selectedValueCol1: any;  

  @Output() onConfirm     = new EventEmitter<PickerCol2Result>();
  @Output() onCancel      = new EventEmitter<void>();
  @Output() onCol0Change  = new EventEmitter<any>();
  @Output() onCol1Change  = new EventEmitter<any>();

  public pickerInitialBreakpoint: number | undefined = 0.35;
  public pickerBreakpoints: number[] | undefined = [0, 0.35];

  //===========================================================================
  constructor(
    private platform: Platform
  ) {}
  ngOnInit() {
    if (this.platform.is('tablet')) {
      this.pickerInitialBreakpoint = undefined;
      this.pickerBreakpoints = undefined;
    }    
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
  public onPickerCol1Change(event: any): void {
    // 🍏 ドラムが回った際の最新値を自分自身の変数に確実に反映させます
    this.selectedValueCol1 = event.detail.value;
    
    this.onCol1Change.emit(this.selectedValueCol1);    
    if (this.isInline) {
      this.emitInlineResult();
    }
  }
  private emitInlineResult(): void {
    const inlineResult: PickerCol2Result = {
      col0: this.selectedValueCol0,
      col1: this.selectedValueCol1
    };
    this.onConfirm.emit(inlineResult);
  }
  public cancelPicker(): void {
    this.onCancel.emit();
  }
  public confirmPicker(): void {
    // 完全に自動同期された最新値が安全にログと親コンポーネントへ渡ります
    const finalResult: PickerCol2Result = {
      col0: this.selectedValueCol0,
      col1: this.selectedValueCol1
    };
//    console.log('[Picker-Col2] Confirmed with 0-origin data:', finalResult);
    this.onConfirm.emit(finalResult);
  }
  //===========================================================================
}
