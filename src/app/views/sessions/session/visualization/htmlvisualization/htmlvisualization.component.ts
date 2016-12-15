import {Component, OnInit, Input} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-htmlvisualization',
  template: `<div [innerHTML]="visualizationHTML"></div>`
})
export class HtmlvisualizationComponent implements OnInit {

  @Input() src: string;

  private visualizationHTML: string;

  constructor(private http: Http) { }

  ngOnInit() {
    this.http.get(this.src).map((res:Response) => {
      const html = res.text();
      return html || '';
    })
      .catch( (error: Response | any) => {
        let errMsg: string;
        if (error instanceof Response) {
          const body = error.json() || '';
          const err = body.error || JSON.stringify(body);
          errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
          errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Observable.throw(errMsg);
      })
      .subscribe( (html: any) => {
        this.visualizationHTML = html;
      });
  }

}
