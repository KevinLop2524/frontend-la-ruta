import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesDelServicio } from './detalles-del-servicio';

describe('DetallesDelServicio', () => {
  let component: DetallesDelServicio;
  let fixture: ComponentFixture<DetallesDelServicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesDelServicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesDelServicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
