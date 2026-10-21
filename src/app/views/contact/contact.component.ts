import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { TokenService } from "../../core/authentication/token.service";
import { ContactSupportService } from "./contact-support.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-contact",
  templateUrl: "./contact.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ManualComponent],
})
export class ContactComponent implements OnInit {
  private errorService = inject(ErrorService);
  private configService = inject(ConfigService);
  private routeService = inject(RouteService);
  private tokenService = inject(TokenService);
  private contactSupportService = inject(ContactSupportService);

  contactFile: string;
  contactPath: string;

  ngOnInit() {
    this.configService.get(ConfigService.KEY_CONTACT_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.contactFile = this.routeService.basename(path);
          this.contactPath = this.routeService.dirname(path) + "/";
        }
      },
      error: (err) => {
        this.errorService.showError("failed to get the contact page path", err);
      },
    });
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  openContactSupportModal() {
    this.contactSupportService.openContactSupportModal();
  }
}
