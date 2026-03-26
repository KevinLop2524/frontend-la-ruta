import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearComunidad } from './crear-comunidad';

describe('CrearComunidad', () => {
  let component: CrearComunidad;
  let fixture: ComponentFixture<CrearComunidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearComunidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearComunidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
