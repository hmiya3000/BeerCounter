import { Component, ElementRef, Input } from '@angular/core';
import { IonButton, IonItem, IonTextarea } from "@ionic/angular/standalone";

@Component({
  selector: 'app-tips-item',
  templateUrl: './tips-item.component.html',
  styleUrls: ['./tips-item.component.scss'],
  standalone:true,
  imports: [IonItem, IonButton, IonTextarea]
})
export class TipsItemComponent {

  @Input() title: string = 'Tips';  // ボタンに表示する文字（初期値：Tips）
  @Input() text: string = '';       // 表示したい説明文（explanation[X]の中身）

  public isOpen: boolean = false;

  constructor(
    private el: ElementRef
  ) {}
  public toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.el.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start' // ➔ 'start' で画面の一番上へスライド、'center' で画面のド真ん中へスライド！
        });
      }, 100); 
    }    
  }
}
