import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AnalyzeGuard } from "./core/routing/analyze-guard.service";
import { AuthGuard } from "./core/routing/auth-guard.service";
import { LandGuard } from "./core/routing/land-guard.service";
import { DummyRouteComponent } from "./shared/components/dummy-route.component";
import { ContactComponent } from "./views/contact/contact.component";
import { MyllyHasMovedComponent } from "./views/error/mylly.component";
import { NotFoundComponent } from "./views/error/not-found.component";
import { HomeComponent } from "./views/home/home.component";
import { LoginComponent } from "./views/login/login.component";
import { OidcCallbackComponent } from "./views/login/oidc-callback.component";
import { ManualComponent } from "./views/manual/manual.component";
import { SessionListComponent } from "./views/sessions/session-list.component";
import { ModifiedSessionGuard } from "./views/sessions/session/modified-session.guard";
import { SessionComponent } from "./views/sessions/session/session.component";
import { TermsComponent } from "./views/terms/terms.component";

const routes: Routes = [
  { path: "home", component: HomeComponent },
  { path: "login", component: LoginComponent },
  {
    path: "mylly",
    children: [{ path: "**", component: MyllyHasMovedComponent }]
  },
  { path: "oidc/callback", component: OidcCallbackComponent },
  { path: "auth/oidc/haka/callback", component: OidcCallbackComponent },
  { path: "terms", component: TermsComponent },
  { path: "contact", component: ContactComponent },
  {
    path: "manual",
    // route all sub-paths here
    children: [{ path: "**", component: ManualComponent }]
  },

  {
    path: "analyze/:sessionId",
    component: SessionComponent,
    canActivate: [AuthGuard],
    canDeactivate: [ModifiedSessionGuard]
  },

  {
    path: "analyze",
    component: DummyRouteComponent, // guard always redirects
    canActivate: [AuthGuard, AnalyzeGuard]
  },
  {
    path: "sessions",
    component: SessionListComponent,
    canActivate: [AuthGuard]
  },

  { path: "notfound", component: NotFoundComponent, pathMatch: "full" },

  {
    path: "",
    component: DummyRouteComponent, // guard always redirects
    canActivate: [LandGuard],
    pathMatch: "full"
  },
  { path: "**", component: NotFoundComponent }
];

@NgModule({
  // imports: [
  //   RouterModule.forRoot(routes, {
  //     scrollPositionRestoration: "enabled",
  //     enableTracing: true
  //   })
  // ],
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: "enabled" })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
