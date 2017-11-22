import {
  Component, HostListener, ViewChild
} from '@angular/core';


/**
 * Scroller component that prevents the parent component from scrolling
 *
 * Affects the scrolling performance considerably, so use only when really needed.
 */
@Component({
  selector: 'ch-scroller',
  templateUrl: './scroller.component.html'
})
export class ScrollerComponent {

  @ViewChild('scroll') scrollElement;

  @HostListener('wheel', ['$event']) onMousewheel(event) {

    let element = this.scrollElement.nativeElement;
    let maxScrollTop = element.scrollHeight - element.clientHeight;

    if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
      // implement other modes if they are really used
      console.warn('unsupported mouse wheel deltaMode: ' + event.deltaMode);
    }

    if (event.deltaY > 0) {
      // scrolling down

      if (event.deltaY > (maxScrollTop - element.scrollTop)) {
        this.scrollElement.scrollTop = maxScrollTop;
        event.preventDefault();
      }
    } else {
      // scrolling up

      if (-event.deltaY > (element.scrollTop)) {
        this.scrollElement.scrollTop = 0;
        event.preventDefault();
      }
    }
  }
}
