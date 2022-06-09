import { Component, Input, OnInit } from "@angular/core";
import log from "loglevel";
import { LoadState } from "../../../model/loadstate";
import { DialogModalService } from "../../../views/sessions/session/dialogmodal/dialogmodal.service";
import { NotificationsService } from "../../services/notifications.service";
import { NotificationItem } from "./NotificationItem";

@Component({
  selector: "ch-notifications-list",
  templateUrl: "./notifications-list.component.html",
})
export class NotificationsListComponent implements OnInit {
  @Input() editable = false;
  public notifications: NotificationItem[];

  public state: LoadState;

  constructor(private dialogModalService: DialogModalService, private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.getNotifications();
  }

  public getNotifications(): void {
    this.state = LoadState.Loading;
    this.notificationsService.getNotifications().subscribe({
      next: (newNotifications: NotificationItem[]) => {
        this.notifications = newNotifications;
        this.state = LoadState.Ready;
      },
    });
  }

  public onAdd() {
    this.notificationsService.openModalAndUploadNotification().subscribe({
      next: (result) => {
        log.info("add notification done", result);
      },
      error: (error) => log.warn("add notification failed", error),
      complete: () => this.getNotifications(),
    });
  }

  public onEdit(notification: NotificationItem) {
    if (!this.editable) {
      return;
    }

    this.notificationsService.openModalAndUploadNotification(notification).subscribe({
      next: (result) => log.info("edit notification done", result),
      error: (error) => log.warn("edit notification failed", error),
      complete: () => this.getNotifications(),
    });
  }

  public onDelete(notification: NotificationItem) {
    if (!this.editable) {
      return;
    }

    this.notificationsService.deleteNotification(notification).subscribe({
      next: (result) => {
        log.info("delete notification done", result);
      },
      error: (error) => log.warn("add notification failed", error),
      complete: () => this.getNotifications(),
    });
  }
}
