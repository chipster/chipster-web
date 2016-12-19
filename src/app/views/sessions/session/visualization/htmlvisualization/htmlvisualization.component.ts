import {Component, OnInit, Input, Inject} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";
import AuthenticationService from "../../../../../authentication/authenticationservice";
import {timeout} from "d3-timer";

@Component({
  selector: 'ch-htmlvisualization',
  template: `<iframe #htmlframe width="100%" [src]="wrapperUrl + '?location=' + src + '&token=' + this.token | trustedresource" scrolling="no" frameborder="0" (load)="run(htmlframe)"></iframe>`
})
export class HtmlvisualizationComponent implements OnInit {

  @Input() src: string;
  private wrapperUrl: string = 'app/views/sessions/session/visualization/htmlvisualization/htmlvisualizationwrapper.html';
  private token: string;

  constructor(private http: Http,
              private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.token =this.authenticationService.getToken();
  }

  run(htmlframe) {
    timeout( () => {
      htmlframe.height = htmlframe.contentWindow.document.body.style.height + 'px';
    }, 1000);
  }

}
// <iframe id="iframeId" src="iframe.html" (load)="onLoad()"></iframe>
// <iframe #htmlIframe id="htmliframe" frameBorder="0" width="100%" scrolling="no" [src]="src | trustedresource" (load)="resize(htmlIframe)"></iframe>
