import {Component, OnInit, Input} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-htmlvisualization',
  template: `<iframe width="100%" [src]="wrapperUrl | trustedresource" scrolling="no" location="asdf" frameborder="0"></iframe>`
})
export class HtmlvisualizationComponent implements OnInit {

  @Input() src: string;
  private wrapperUrl: string = './htmlvisualizationwrapper.html';

  constructor(private http: Http) { }

  ngOnInit() {}

}
// <iframe id="iframeId" src="iframe.html" (load)="onLoad()"></iframe>
// <iframe #htmlIframe id="htmliframe" frameBorder="0" width="100%" scrolling="no" [src]="src | trustedresource" (load)="resize(htmlIframe)"></iframe>
