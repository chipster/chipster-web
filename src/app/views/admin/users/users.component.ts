import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { User } from "chipster-js-common";

@Component({
  selector: "ch-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class UsersComponent implements OnInit {
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
