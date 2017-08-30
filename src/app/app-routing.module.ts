import {NgModule}             from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {SessionListComponent} from "./views/sessions/sessionlist.component";
import {SessionResolve} from "./views/sessions/session/session.resolve";
import {SessionComponent} from "./views/sessions/session/session.component";
import {AuthGuard} from "./core/authentication/auth-guard.service";


const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {
    path: 'sessions',
    component: SessionListComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'sessions/:sessionId',
    component: SessionComponent,
    resolve: {sessionData: SessionResolve},
    canActivate: [AuthGuard]
  },
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: '**', redirectTo: '/home'}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
