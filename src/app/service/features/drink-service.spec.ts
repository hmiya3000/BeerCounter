import { TestBed } from '@angular/core/testing';

import { DrinkSvc } from './drink';

describe('DrinkSvc', () => {
  let service: DrinkSvc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrinkSvc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
