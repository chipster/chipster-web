import { Component, HostListener, ViewChild } from "@angular/core";

/**
 * Scroller component that prevents the parent component from scrolling
 *
 * Affects the scrolling performance considerably, so use only when really needed.
 */
@Component({
  selector: "ch-scroller",
  templateUrl: "./scroller.component.html"
})
export class ScrollerComponent {
  @ViewChild("scroll") scrollElement;

  @HostListener("wheel", ["$event"]) onMousewheel(event) {
    const element = this.scrollElement.nativeElement;
    const scrollTop = element.scrollTop;
    const maxScrollTop = element.scrollHeight - element.clientHeight;

    if (event.deltaY > 0) {
      // scrolling down
      if (scrollTop >= maxScrollTop) {
        event.preventDefault();
      }
    } else {
      // scrolling up
      if (scrollTop <= 0) {
        event.preventDefault();
      }
    }
  }
}
