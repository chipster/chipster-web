import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal, NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../../../shared/shared.module";
import { BooleanModalComponent } from "./booleanmodal/booleanmodal.component";
import { DialogModalService } from "./dialogmodal.service";
import { DownloadFromUrlModalComponent } from "./download-from-url-modal/download-from-url.component";
import { NotesModalComponent } from "./notes-modal/notes-modal.component";
import { PreModalComponent } from "./pre-modal/pre-modal.component";
import { SharingModalComponent } from "./sharingmodal/sharingmodal.component";
import { SpinnerModalComponent } from "./spinnermodal/spinnermodal.component";
import { StringModalComponent } from "./stringmodal/stringmodal.component";
import { TempCopyModalComponent } from "./temp-copy-modal/temp-copy-modal.component";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [
    StringModalComponent,
    BooleanModalComponent,
    NotesModalComponent,
    SharingModalComponent,
    SpinnerModalComponent,
    TempCopyModalComponent,
    PreModalComponent,
    DownloadFromUrlModalComponent
  ],
  providers: [NgbActiveModal, DialogModalService],
  exports: [],
  entryComponents: [
    StringModalComponent,
    BooleanModalComponent,
    NotesModalComponent,
    SharingModalComponent,
    SpinnerModalComponent,
    TempCopyModalComponent,
    PreModalComponent,
    DownloadFromUrlModalComponent
  ]
})
export class DialogModalModule {}
