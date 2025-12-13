import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosGraficos } from './servicios-graficos';

describe('ServiciosGraficos', () => {
  let component: ServiciosGraficos;
  let fixture: ComponentFixture<ServiciosGraficos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosGraficos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosGraficos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
