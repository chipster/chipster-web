import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ServicesComponent } from "./services.component";

describe("ServicesComponent", () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
    declarations: [ServicesComponent],
    teardown: { destroyAfterEach: false }
}).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
