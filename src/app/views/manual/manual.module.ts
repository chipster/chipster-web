import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../shared/shared.module";
import { ManualComponent } from "./manual.component";
import { ManualModalComponent } from "./manual-modal/manual-modal.component";
import { StaticHtmlComponent } from "./static-html/static-html.component";

@NgModule({
  imports: [CommonModule, SharedModule, NgbModule],
  declarations: [
    ManualComponent,
    ManualModalComponent,
    StaticHtmlComponent
  ],
  providers: [],
  exports: [ManualComponent, ManualModalComponent, StaticHtmlComponent],
  entryComponents: [
    ManualModalComponent,
  ]
})
export class ManualModule {}
