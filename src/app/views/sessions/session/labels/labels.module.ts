import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { LabelEditorModalComponent } from "./label-editor-modal.component";
import { LabelMenuItemContentComponent } from "./label-menu-item-content.component";
import { LabelPillComponent } from "./label-pill.component";
import { LabelsContextMenuService } from "./labels-context-menu.service";
import { LabelsModalComponent } from "./labels-modal.component";

@NgModule({
  imports: [CommonModule, FormsModule, NgbModule],
  declarations: [LabelEditorModalComponent, LabelMenuItemContentComponent, LabelPillComponent, LabelsModalComponent],
  exports: [LabelEditorModalComponent, LabelMenuItemContentComponent, LabelPillComponent, LabelsModalComponent],
  providers: [LabelsContextMenuService],
})
export class LabelsModule {}
