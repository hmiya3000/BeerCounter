import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonTextarea, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; 
import { closeCircle } from 'ionicons/icons'; 

export interface NumericInputEvent {
  event: any;
  type: 'ionInput' | 'ionBlur';
  key: string;
}

@Component({
  selector: 'app-freetext-input',
  templateUrl: './freetext-input.component.html',
  styleUrls: ['./freetext-input.component.scss'],
  imports: [IonTextarea, IonButton, IonIcon],
  standalone: true
})
export class FreetextInputComponent {

  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() isReadonly: boolean = false;
  @Input() controlKey: string = '';
  @Input() rows: number = 1; 

  @Output() onUpdate = new EventEmitter<NumericInputEvent>();

  constructor() {
    // 💡 バツボタン用のアイコンを登録します
    addIcons({ closeCircle });
  }

  public handleInput(ev: any): void {
    this.value = ev.target.value;
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
  public clearText(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.value = '';
    const mockEvent = { target: { value: '' } };
    this.onUpdate.emit({
      event: mockEvent,
      type: 'ionInput',
      key: this.controlKey
    });
  }  
}