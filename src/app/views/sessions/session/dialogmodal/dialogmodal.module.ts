import {NgModule} from '@angular/core';
import {NgbModule, NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal.component";
import {DialogModalService} from "./dialogmodal.service";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {BooleanModalComponent} from "./booleanmodal.component";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [StringModalComponent, BooleanModalComponent],
  providers: [NgbActiveModal, DialogModalService],
  exports: [],
  entryComponents: [StringModalComponent, BooleanModalComponent]
})
export class DialogModalModule { }
