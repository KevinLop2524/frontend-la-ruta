import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearServicio } from './crear-servicio';

describe('CrearServicio', () => {
  let component: CrearServicio;
  let fixture: ComponentFixture<CrearServicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearServicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearServicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
