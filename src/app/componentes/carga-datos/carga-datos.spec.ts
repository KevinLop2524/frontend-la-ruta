import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaDatos } from './carga-datos';

describe('CargaDatos', () => {
  let component: CargaDatos;
  let fixture: ComponentFixture<CargaDatos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaDatos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargaDatos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
