import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'ch-htmlvisualization',
  templateUrl: './htmlvisualization.component.html',
  styleUrls: ['./htmlvisualization.component.less'],
})
export class HtmlvisualizationComponent implements OnInit {

  @Input() src: string;

  constructor() { }

  ngOnInit() {}

  resize(htmlIframe: HTMLIFrameElement) {
    htmlIframe.style.height = '1000px';
    // htmlIframe.style.height = htmlIframe.contentWindow.document.body.scrollHeight + 'px';
  }

}
