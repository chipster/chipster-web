import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { LabelEditorModalComponent } from "./label-editor-modal.component";
import { LabelPillComponent } from "./label-pill.component";
import { LabelsContextMenuService } from "./labels-context-menu.service";
import { LabelsModalComponent } from "./labels-modal.component";

@NgModule({
  imports: [CommonModule, FormsModule, NgbModule],
  declarations: [LabelEditorModalComponent, LabelPillComponent, LabelsModalComponent],
  exports: [LabelEditorModalComponent, LabelPillComponent, LabelsModalComponent],
  providers: [LabelsContextMenuService],
})
export class LabelsModule {}
