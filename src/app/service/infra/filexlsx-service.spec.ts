import { TestBed } from '@angular/core/testing';

import { FilexlsxService } from './filexlsx-service';

describe('FilexlsxService', () => {
  let service: FilexlsxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilexlsxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
