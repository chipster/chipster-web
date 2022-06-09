import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NotificationItem } from "../../../../../shared/components/notifications/NotificationItem";

@Component({
  templateUrl: "./edit-notification-modal.component.html",
})
export class EditNotificationModalComponent implements OnInit {
  public modalTitle: string;
  @Input()
  notification: NotificationItem;

  titleControl = new FormControl("");
  shortTitleControl = new FormControl("");
  messageControl = new FormControl("");
  id: string;
  date: Date;

  form = new FormGroup({
    title: this.titleControl,
    shortTitle: this.shortTitleControl,
    message: this.messageControl,
  });

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.notification == null) {
      this.modalTitle = "Add notification";
    } else {
      this.titleControl.setValue(this.notification.title);
      this.messageControl.setValue(this.notification.message);
      this.modalTitle = "Edit notification";
      this.id = this.notification.id;
      this.date = this.notification.date;
    }
  }

  public onSubmit(): void {
    this.activeModal.close({
      title: this.titleControl.value,
      shortTitle: this.shortTitleControl.value,
      message: this.messageControl.value,
      id: this.id,
      date: this.date,
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
