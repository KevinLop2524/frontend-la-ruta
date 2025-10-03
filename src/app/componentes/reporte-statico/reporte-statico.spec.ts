import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteStatico } from './reporte-statico';

describe('ReporteStatico', () => {
  let component: ReporteStatico;
  let fixture: ComponentFixture<ReporteStatico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteStatico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteStatico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
