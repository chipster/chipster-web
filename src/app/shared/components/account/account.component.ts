import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { TokenService } from "../../../core/authentication/token.service";

@Component({
  selector: "ch-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AccountComponent {
  private tokenService = inject(TokenService);
  private activeModal = inject(NgbActiveModal);

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
