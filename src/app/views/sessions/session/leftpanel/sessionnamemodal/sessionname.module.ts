import {NgModule} from '@angular/core';
import {NgbModule, NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SessionNameModalComponent} from "./sessionnamemodal.component";
import {SessionNameModalService} from "./sessionnamemodal.service";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [SessionNameModalComponent],
  providers: [NgbActiveModal, SessionNameModalService],
  exports: [],
  entryComponents: [SessionNameModalComponent]
})
export class SessionNameModalModule { }
