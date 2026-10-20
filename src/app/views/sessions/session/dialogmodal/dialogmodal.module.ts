import { NgModule } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DialogModalService } from "./dialogmodal.service";

@NgModule({
  providers: [NgbActiveModal, DialogModalService],
})
export class DialogModalModule {}
