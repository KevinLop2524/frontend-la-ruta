import { TestBed } from '@angular/core/testing';

import { Peticion } from './peticion';

describe('Peticion', () => {
  let service: Peticion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Peticion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
