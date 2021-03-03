import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../shared/shared.module";
import { ManualAComponent } from "./manual-components/manual-a.component";
import { ManualDivComponent } from "./manual-components/manual-div.component";
import { ManualLiComponent } from "./manual-components/manual-li.component";
import { ManualOlComponent } from "./manual-components/manual-ol.component";
import { ManualPComponent } from "./manual-components/manual-p.component";
import { ManualSpanComponent } from "./manual-components/manual-span.component";
import { ManualUlComponent } from "./manual-components/manual-ul.component";
import { ManualModalComponent } from "./manual-modal/manual-modal.component";
import { ManualComponent } from "./manual.component";

@NgModule({
  imports: [CommonModule, SharedModule, NgbModule],
  declarations: [
    ManualComponent,
    ManualModalComponent,
    ManualAComponent,
    ManualOlComponent,
    ManualLiComponent,
    ManualUlComponent,
    ManualDivComponent,
    ManualSpanComponent,
    ManualPComponent
  ],
  providers: [],
  exports: [ManualComponent, ManualModalComponent]
})
export class ManualModule {}
