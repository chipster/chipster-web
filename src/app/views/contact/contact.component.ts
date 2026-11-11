import { Component, OnInit, inject, signal } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { TokenService } from "../../core/authentication/token.service";
import { ContactSupportService } from "./contact-support.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-contact",
  templateUrl: "./contact.component.html",
  imports: [ManualComponent],
})
export class ContactComponent implements OnInit {
  private errorService = inject(ErrorService);
  private configService = inject(ConfigService);
  private routeService = inject(RouteService);
  private tokenService = inject(TokenService);
  private contactSupportService = inject(ContactSupportService);

  readonly contactFile = signal<string>(undefined);
  readonly contactPath = signal<string>(undefined);

  ngOnInit() {
    this.configService.get(ConfigService.KEY_CONTACT_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.contactFile.set(this.routeService.basename(path));
          this.contactPath.set(this.routeService.dirname(path) + "/");
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
