import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BamviewerComponent } from './bamviewer.component';

describe('BamviewerComponent', () => {
  let component: BamviewerComponent;
  let fixture: ComponentFixture<BamviewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BamviewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BamviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
