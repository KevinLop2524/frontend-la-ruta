import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicacionesDeComunidad } from './publicaciones-de-comunidad';

describe('PublicacionesDeComunidad', () => {
  let component: PublicacionesDeComunidad;
  let fixture: ComponentFixture<PublicacionesDeComunidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionesDeComunidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicacionesDeComunidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
