import { Input, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';

export class ManualBaseComponent implements AfterViewInit {

  // Angular component, like <ch-manual-a-component>
  @ViewChild('container', {read: ViewContainerRef}) public viewContainerRef: ViewContainerRef;

  // the actual element, like <a>
  @ViewChild('element', {read: ViewContainerRef}) public elementViewContainerRef: ViewContainerRef;

  // attributes of the original element to be copied for this replacement, like the "href" address of the <a>
  @Input() private attributes;

  ngAfterViewInit() {
    // apply the given attributes for the new element
    if (this.attributes) {
      for (let j = 0; j < this.attributes.length; j++) {
        const attrib = this.attributes[j];
        // console.log(attrib.name + " = " + attrib.value);
        if (this.elementViewContainerRef) {
          this.elementViewContainerRef.element.nativeElement.setAttribute(attrib.name, attrib.value);
        } else {
          console.log('component', this, 'unable to set attribute', attrib.name, attrib.value);
        }
      }
    }
  }

  appendChild(element) {
    this.elementViewContainerRef.element.nativeElement.appendChild(element);
  }
}

