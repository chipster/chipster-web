import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { User } from "chipster-js-common";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { LocalDatePipe } from "../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  imports: [LocalDatePipe],
})
export class UsersComponent implements OnInit {
  users: User[];

  constructor(
    private restErrorService: RestErrorService,
    private authenticationService: AuthenticationService,
  ) {}

  ngOnInit() {
    this.users = [];

    this.authenticationService.getUsers().subscribe(
      (users: User[]) => {
        this.users = users;
      },
      (err) => this.restErrorService.showError("get users failed", err),
    );
  }
}
