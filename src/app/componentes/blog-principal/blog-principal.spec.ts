import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogPrincipal } from './blog-principal';

describe('BlogPrincipal', () => {
  let component: BlogPrincipal;
  let fixture: ComponentFixture<BlogPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogPrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});