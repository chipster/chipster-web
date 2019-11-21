import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportToolComponent } from './import-tool.component';

describe('ImportToolComponent', () => {
  let component: ImportToolComponent;
  let fixture: ComponentFixture<ImportToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
