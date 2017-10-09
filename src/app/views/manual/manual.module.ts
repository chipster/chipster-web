import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedModule} from "../../shared/shared.module";
import {ManualComponent} from "./manual.component";
import {ManualAComponent} from "./manual-components/manual-a.component";
import {ManualOlComponent} from "./manual-components/manual-ol.component";
import {ManualLiComponent} from "./manual-components/manual-li.component";
import {ManualUlComponent} from "./manual-components/manual-ul.component";
import {ManualDivComponent} from "./manual-components/manual-div.component";
import {ManualSpanComponent} from "./manual-components/manual-span.component";

@NgModule({
  imports: [ CommonModule, SharedModule],
  declarations: [
    ManualComponent,
    ManualAComponent,
    ManualOlComponent,
    ManualLiComponent,
    ManualUlComponent,
    ManualDivComponent,
    ManualSpanComponent
  ],
  providers: [],
  exports: [],
  entryComponents: [
    ManualAComponent,
    ManualOlComponent,
    ManualLiComponent,
    ManualUlComponent,
    ManualDivComponent,
    ManualSpanComponent,
  ]
})
export class ManualModule { }
