import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonInput } from '@ionic/angular/standalone';

export interface NumericInputEvent {
  event: any;        // $event 本体の肉体
  type: 'ionInput' | 'ionBlur'; // 入力中か、フォーカスが外れたか
  key: string;       // 'areaLandCurr' などの識別キー
}
@Component({
  selector: 'app-numeric-input',
  templateUrl: './numeric-input.component.html',
  styleUrls: ['./numeric-input.component.scss'],
  standalone: true,
  imports: [IonInput]
})
export class NumericInputComponent {

  @Input() value: string | number = '';
  @Input() placeholder: string = '000.00';
  @Input() controlKey: string = ''; 
  @Input() inputMode: 'decimal' | 'numeric' = 'decimal'; 
  @Input() isReadonly: boolean = false; 
  @Input() customClass: string = ''; 

  @Output() onUpdate = new EventEmitter<NumericInputEvent>();

  public handleInput(ev: any): void {
    this.onUpdate.emit({
      event: ev,
      type: 'ionInput',
      key: this.controlKey
    });
  }
  public handleBlur(ev: any): void {
    this.onUpdate.emit({
      event: ev,
      type: 'ionBlur',
      key: this.controlKey
    });
  }
}
