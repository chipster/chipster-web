import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { User } from "chipster-js-common";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NotificationsComponent implements OnInit {
  users: User[];

  constructor(private restErrorService: RestErrorService, private authenticationService: AuthenticationService) {}

  ngOnInit() {
    this.users = [];

    this.authenticationService.getUsers().subscribe(
      (users: User[]) => {
        this.users = users;
      },
      (err) => this.restErrorService.showError("get users failed", err)
    );
  }
}
