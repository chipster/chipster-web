import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, inject } from "@angular/core";
import { User } from "chipster-js-common";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { LocalDatePipe } from "../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LocalDatePipe],
})
export class UsersComponent implements OnInit {
  private restErrorService = inject(RestErrorService);
  private authenticationService = inject(AuthenticationService);

  users: User[];

  ngOnInit() {
    this.users = [];

    this.authenticationService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
      },
      error: (err) => this.restErrorService.showError("get users failed", err),
    });
  }
}
