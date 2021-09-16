import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { TokenService } from "../../../core/authentication/token.service";

@Component({
  selector: "ch-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.less"],
})
export class AccountComponent {
  constructor(private tokenService: TokenService, private activeModal: NgbActiveModal) {}

  getAccountName(): string {
    return this.tokenService.getAccountName();
  }

  getUserId(): string {
    return this.tokenService.getUsername();
  }

  close(): void {
    this.activeModal.close();
  }
}
