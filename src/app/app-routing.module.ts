import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./views/home/home.component";
import { LoginComponent } from "./views/login/login.component";
import { SessionListComponent } from "./views/sessions/session-list.component";
import { SessionComponent } from "./views/sessions/session/session.component";
import { AuthGuard } from "./core/authentication/auth-guard.service";
import { ContactComponent } from "./views/contact/contact.component";
import { ManualComponent } from "./views/manual/manual.component";
import { ModifiedSessionGuard } from "./views/sessions/session/modified-session.guard";
import { TermsComponent } from "./views/terms/terms.component";

const routes: Routes = [
  { path: ":appName/home", component: HomeComponent },
  { path: ":appName/login", component: LoginComponent },
  { path: ":appName/terms", component: TermsComponent },
  {
    path: ":appName/manual",
    // route all sub-paths here
    children: [{ path: "**", component: ManualComponent }]
  },
  { path: ":appName/contact", component: ContactComponent },
  {
    path: ":appName/sessions",
    component: SessionListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ":appName/sessions/:sessionId",
    component: SessionComponent,
    canActivate: [AuthGuard],
    canDeactivate: [ModifiedSessionGuard]
  },
  { path: ":appName", redirectTo: ":appName/home" },
  { path: "", redirectTo: "chipster/home", pathMatch: "full" },
  { path: "**", redirectTo: "chipster/home" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
