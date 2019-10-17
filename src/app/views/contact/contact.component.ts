import { Component, OnInit } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { TokenService } from "../../core/authentication/token.service";
import { ContactSupportService } from "./contact-support.service";

@Component({
  selector: "ch-contact",
  templateUrl: "./contact.component.html"
})
export class ContactComponent implements OnInit {
  contactFile: string;
  contactPath: string;

  constructor(
    private errorService: ErrorService,
    private configService: ConfigService,
    private routeService: RouteService,
    private tokenService: TokenService,
    private contactSupportService: ContactSupportService
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_CONTACT_PATH).subscribe(
      path => {
        if (path) {
          this.contactFile = this.routeService.basename(path);
          this.contactPath = this.routeService.dirname(path) + "/";
        }
      },
      err => {
        this.errorService.showError("failed to get the contact page path", err);
      }
    );
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  openContactSupportModal() {
    this.contactSupportService.openContactSupportModal();
  }
}
