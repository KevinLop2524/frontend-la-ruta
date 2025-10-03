import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogAdminStatico } from './blog-admin-statico';

describe('BlogAdminStatico', () => {
  let component: BlogAdminStatico;
  let fixture: ComponentFixture<BlogAdminStatico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogAdminStatico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogAdminStatico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
