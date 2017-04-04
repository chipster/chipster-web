import {NgModule} from '@angular/core';
import {NgbModule, NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal.component";
import {StringModalService} from "./stringmodal.service";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [StringModalComponent],
  providers: [NgbActiveModal, StringModalService],
  exports: [],
  entryComponents: [StringModalComponent]
})
export class SessionNameModalModule { }
