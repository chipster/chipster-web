import {Component, OnInit} from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: 'ch-contact',
  templateUrl: './contact.component.html'
})
export class ContactComponent implements OnInit {

  contactFile: string;
  contactPath: string;

  constructor(
    private errorService: ErrorService,
    private configService: ConfigService,
    private routeServcie: RouteService) {
  }

  ngOnInit() {
    this.configService.get(ConfigService.KEY_CONTACT_PATH).subscribe(path => {
      if (path) {
        this.contactFile = this.routeServcie.basename(path);
        this.contactPath = this.routeServcie.dirname(path) + '/';
      }
    }, err => {
      console.error('failed to get the contact page path', err);
      this.errorService.headerError('failed to get the contact page path', err);
    });
  }
}
