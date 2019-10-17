import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GenomeBrowserComponent } from "./genome-browser.component";

describe("GenomeBrowserComponent", () => {
  let component: GenomeBrowserComponent;
  let fixture: ComponentFixture<GenomeBrowserComponent>;

  beforeEach(async(() => {
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
