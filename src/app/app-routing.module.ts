import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./views/home/home.component";
import { LoginComponent } from "./views/login/login.component";
import { SessionListComponent } from "./views/sessions/session-list.component";
import { SessionComponent } from "./views/sessions/session/session.component";
import { AuthGuard } from "./core/routing/auth-guard.service";
import { ContactComponent } from "./views/contact/contact.component";
import { ManualComponent } from "./views/manual/manual.component";
import { ModifiedSessionGuard } from "./views/sessions/session/modified-session.guard";
import { TermsComponent } from "./views/terms/terms.component";
import { LandGuard } from "./core/routing/land-guard.service";
import { AnalyzeGuard } from "./core/routing/analyze-guard.service";
import { DummyRouteComponent } from "./shared/components/dummy-route.component";
import { NotFoundComponent } from "./views/error/not-found.component";
import { AppNameGuard } from "./core/routing/app-name-guard.service";

const routes: Routes = [
  { path: ":appName/home", component: HomeComponent },
  { path: ":appName/login", component: LoginComponent },
  { path: ":appName/terms", component: TermsComponent },
  { path: ":appName/contact", component: ContactComponent },
  {
    path: ":appName/manual",
    // route all sub-paths here
    children: [{ path: "**", component: ManualComponent }]
  },

  {
    path: ":appName/analyze/:sessionId",
    component: SessionComponent,
    canActivate: [AppNameGuard, AuthGuard],
    canDeactivate: [ModifiedSessionGuard]
  },

  {
    path: ":appName/analyze",
    component: DummyRouteComponent, // guard always redirects
    canActivate: [AppNameGuard, AuthGuard, AnalyzeGuard]
  },
  {
    path: ":appName/sessions",
    component: SessionListComponent,
    canActivate: [AppNameGuard, AuthGuard]
  },

  { path: "notfound", component: NotFoundComponent, pathMatch: "full" },

  {
    path: ":appName",
    component: DummyRouteComponent, // guard always redirects
    canActivate: [AppNameGuard, LandGuard]
  },

  { path: "", redirectTo: "chipster", pathMatch: "full" },
  { path: "**", component: NotFoundComponent }
];

@NgModule({
  // imports: [RouterModule.forRoot(routes, { enableTracing: true })],
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule {}
