import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {SessionListComponent} from "./views/sessions/sessionlist.component";
import {SessionComponent} from "./views/sessions/session/session.component";
import {AuthGuard} from "./core/authentication/auth-guard.service";
import {ContactComponent} from "./views/contact/contact.component";
import {ManualComponent} from "./views/manual/manual.component";
import {ModifiedSessionGuard} from "./views/sessions/session/modified-session.guard";

const routes: Routes = [
  { path: 'home',  component: HomeComponent },
  { path: 'login',  component: LoginComponent },
  {
    path: 'manual',
    // route all sub-paths here
    children: [
      { path: '**', component: ManualComponent }
    ]
  },
  { path: 'contact',  component: ContactComponent },
  {
    path: 'sessions',
    component: SessionListComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'sessions/:sessionId',
    component: SessionComponent,
    canActivate: [AuthGuard],
    canDeactivate: [ModifiedSessionGuard]
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
