import {NgModule} from '@angular/core';
import {NgbModule, NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal/stringmodal.component";
import {DialogModalService} from "./dialogmodal.service";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {BooleanModalComponent} from "./booleanmodal/booleanmodal.component";
import {NotesModalComponent} from "./notesmodal/notesmodal.component";
import {SharingModalComponent} from "./sharingmodal/sharingmodal.component";
import {SpinnerModalComponent} from "./spinnermodal/spinnermodal.component";
import {TempCopyModalComponent} from "./temp-copy-modal/temp-copy-modal.component";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [
    StringModalComponent,
    BooleanModalComponent,
    NotesModalComponent,
    SharingModalComponent,
    SpinnerModalComponent,
    TempCopyModalComponent
  ],
  providers: [NgbActiveModal, DialogModalService],
  exports: [],
  entryComponents: [
    StringModalComponent,
    BooleanModalComponent,
    NotesModalComponent,
    SharingModalComponent,
    SpinnerModalComponent,
    TempCopyModalComponent
  ]
})
export class DialogModalModule { }
