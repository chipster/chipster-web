import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "../../core/routing/auth-guard.service";
import { AdminComponent } from "./admin.component";
import { ClientsComponent } from "./clients/clients.component";
import { HistoryComponent } from "./history/history.component";
import { JobsComponent } from "./jobs/jobs.component";
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { NotificationsComponent } from "./notifications/notifications.component";
import { ServicesComponent } from "./services/services.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { StorageComponent } from "./storage/storage.component";
import { UsersComponent } from "./users/users.component";

const routes: Routes = [
  {
    path: "admin",
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: "", redirectTo: "services", pathMatch: "full" },
      { path: "services", component: ServicesComponent },
      { path: "clients", component: ClientsComponent },
      { path: "users", component: UsersComponent },
      { path: "storage", component: StorageComponent },
      { path: "jobs", component: JobsComponent },
      { path: "history", component: HistoryComponent },
      { path: "statistics", component: StatisticsComponent },
      { path: "notifications", component: NotificationsComponent },
      { path: "maintenance", component: MaintenanceComponent },
      { path: "**", redirectTo: "services" },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
