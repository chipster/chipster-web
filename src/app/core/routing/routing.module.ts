import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppNameGuard } from "./app-name-guard.service";
import { AuthGuard } from "./auth-guard.service";
import { LandGuard } from "./land-guard.service";
import { AnalyzeGuard } from "./analyze-guard.service";

@NgModule({
  imports: [CommonModule],
  providers: [AppNameGuard, AuthGuard, LandGuard, AnalyzeGuard]
})
export class RoutingModule {}
