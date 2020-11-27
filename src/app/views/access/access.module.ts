import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ManualModule } from '../manual/manual.module';
import { AccessComponent } from './access.component';

@NgModule({
  imports: [CommonModule, ManualModule],
  declarations: [AccessComponent],
})
export class AccessModule {}
