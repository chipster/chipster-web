import { NgModule } from "@angular/core";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { FormsModule } from "@angular/forms";
import { LinkButtonComponent } from "./link-button.component";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [LinkButtonComponent],
  exports: [LinkButtonComponent],
})
export class LinkButtonModule {}
