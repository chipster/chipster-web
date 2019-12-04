import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlickgridVisualizationComponent } from './slickgrid-visualization.component';

describe('SlickgridVisualizationComponent', () => {
  let component: SlickgridVisualizationComponent;
  let fixture: ComponentFixture<SlickgridVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlickgridVisualizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlickgridVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
