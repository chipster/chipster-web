import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../../shared/shared.module";
import { ManualModule } from "../manual/manual.module";
import { ContactSupportModalComponent } from "./contact-support-modal/contact-support-modal.component";
import { ContactSupportService } from "./contact-support.service";
import { ContactComponent } from "./contact.component";

@NgModule({
  imports: [CommonModule, SharedModule, ManualModule, ReactiveFormsModule],
  declarations: [ContactComponent, ContactSupportModalComponent],
  providers: [ContactSupportService]
})
export class ContactModule {}
