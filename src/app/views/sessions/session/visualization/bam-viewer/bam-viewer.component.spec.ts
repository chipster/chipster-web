import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { BamViewerComponent } from "./bam-viewer.component";

describe("BamviewerComponent", () => {
  let component: BamViewerComponent;
  let fixture: ComponentFixture<BamViewerComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
    declarations: [BamViewerComponent],
    teardown: { destroyAfterEach: false }
}).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(BamViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
