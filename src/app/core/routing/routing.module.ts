import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppNameGuard } from "./app-name-guard.service";

@NgModule({
  imports: [CommonModule],
  providers: [AppNameGuard]
})
export class RoutingModule {}
