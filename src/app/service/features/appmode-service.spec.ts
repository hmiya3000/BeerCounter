import { TestBed } from '@angular/core/testing';

import { AppmodeService } from './core/appmode-service';

describe('AppmodeService', () => {
  let service: AppmodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppmodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
