import { NgModule } from "@angular/core";
import { AnalyzeGuard } from "./analyze-guard.service";
import { AuthGuard } from "./auth-guard.service";
import { LandGuard } from "./land-guard.service";

@NgModule({
  providers: [AuthGuard, LandGuard, AnalyzeGuard],
})
export class RoutingModule {}
