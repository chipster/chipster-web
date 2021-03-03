import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GenomeBrowserComponent } from "./genome-browser.component";

describe("GenomeBrowserComponent", () => {
  let component: GenomeBrowserComponent;
  let fixture: ComponentFixture<GenomeBrowserComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GenomeBrowserComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenomeBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
