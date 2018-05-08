import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AdminComponent} from "./admin.component";
import {AuthGuard} from "../../core/authentication/auth-guard.service";
import {ServicesComponent} from "./services/services.component";
import {ClientsComponent} from "./clients/clients.component";
import {StorageComponent} from "./storage/storage.component";
import {JobsComponent} from "./jobs/jobs.component";
import {HistoryComponent} from "./history/history.component";
import {StatisticsComponent} from "./statistics/statistics.component";
import {UsersComponent} from "./users/users.component";

const routes: Routes = [
  {
    path: ':appName/admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'services', pathMatch: 'full' },
      { path: 'services', component: ServicesComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'storage', component: StorageComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'statistics', component: StatisticsComponent },
      { path: '**', redirectTo: 'services' }
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AdminRoutingModule { }
