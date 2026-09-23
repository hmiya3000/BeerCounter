import { TestBed } from '@angular/core/testing';

import { SalvageService } from './salvage-service';

describe('SalvageService', () => {
  let service: SalvageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalvageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
