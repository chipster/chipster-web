import { Component, OnInit, ViewEncapsulation, inject, signal } from "@angular/core";
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
  private restErrorService = inject(RestErrorService);
  private authenticationService = inject(AuthenticationService);

  readonly users = signal<User[]>(undefined);

  ngOnInit() {
    this.users.set([]);

    this.authenticationService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
      },
      error: (err) => this.restErrorService.showError("get users failed", err),
    });
  }
}
