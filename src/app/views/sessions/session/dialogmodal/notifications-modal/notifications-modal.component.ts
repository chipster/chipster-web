import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notifications-modal.component.html",
})
export class NotificationsModalComponent implements OnInit {
  public notifications = [
    {
      title: "New version released",
      date: new Date(),
      message:
        '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
    },
    {
      title: "Service break",
      date: new Date(),
      message: "Everything is broken.",
    },
  ];

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {}

  close(): void {
    this.activeModal.dismiss();
  }
}
