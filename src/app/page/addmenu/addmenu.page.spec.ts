import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddmenuPage } from './addmenu.page';

describe('AddmenuPage', () => {
  let component: AddmenuPage;
  let fixture: ComponentFixture<AddmenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddmenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
