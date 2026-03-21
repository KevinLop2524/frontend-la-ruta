import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogComunidad } from './blog-comunidad';

describe('BlogComunidad', () => {
  let component: BlogComunidad;
  let fixture: ComponentFixture<BlogComunidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogComunidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogComunidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
