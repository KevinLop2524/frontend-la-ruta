import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteMulti } from './reporte-multi';

describe('ReporteMulti', () => {
  let component: ReporteMulti;
  let fixture: ComponentFixture<ReporteMulti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteMulti]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteMulti);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
