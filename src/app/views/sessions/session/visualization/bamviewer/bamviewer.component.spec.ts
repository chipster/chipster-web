import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BamViewerComponent } from "./bamviewer.component";

describe("BamviewerComponent", () => {
  let component: BamViewerComponent;
  let fixture: ComponentFixture<BamViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BamViewerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BamViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
