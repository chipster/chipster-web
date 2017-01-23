import {Component, OnInit, Input, Inject} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";
import AuthenticationService from "../../../../../core/authentication/authenticationservice";
import {timeout} from "d3-timer";
import {TokenService} from "../../../../../core/authentication/token.service";

@Component({
  selector: 'ch-htmlvisualization',
  template: `<iframe #htmlframe width="100%" [src]="wrapperUrl + '?location=' + src + '&token=' + this.token | trustedresource" scrolling="no" frameborder="0" (load)="run(htmlframe)"></iframe>`
})
export class HtmlvisualizationComponent implements OnInit {

  @Input() src: string;
  private wrapperUrl: string = 'app/views/sessions/session/visualization/htmlvisualization/htmlvisualizationwrapper.html';
  private token: string;

  constructor(private tokenService: TokenService) { }

  ngOnInit() {
    this.token =this.tokenService.getToken();
  }

  run(htmlframe) {
    timeout( () => {
      let height = htmlframe.contentWindow.document.body.style.height;
      if (height) {
        htmlframe.height = height + 'px';
      } else {
        this.run(htmlframe);
      }
    }, 100);
  }
}
