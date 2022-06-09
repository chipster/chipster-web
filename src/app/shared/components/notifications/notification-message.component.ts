import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NotificationItem } from "./NotificationItem";

@Component({
  selector: "ch-notification-message",
  templateUrl: "./notification-message.component.html",
})
export class NotificationMessageComponent {
  @Input() notification: NotificationItem;
  @Input() editable = false;
  @Output() edit = new EventEmitter<NotificationItem>();
  @Output() delete = new EventEmitter<NotificationItem>();

  public onEdit(notification: NotificationItem) {
    this.edit.emit(notification);
  }

  public onDelete(notification: NotificationItem) {
    this.delete.emit(notification);
  }
}
