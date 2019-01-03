import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../shared/shared.module";
import { ContactComponent } from "./contact.component";
import { ContactSupportModalComponent } from "./contact-support-modal/contact-support-modal.component";
import { ManualModule } from "../manual/manual.module";
import { FormsModule } from "@angular/forms";
import { ContactSupportService } from "./contact-support.service";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ManualModule,
    FormsModule,
  ],
  declarations: [
    ContactComponent,
    ContactSupportModalComponent,
  ],
  providers: [
    ContactSupportService,
  ],
  entryComponents: [
    ContactSupportModalComponent,
  ]
})
export class ContactModule {}
