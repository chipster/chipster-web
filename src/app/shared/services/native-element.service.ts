import { Injectable } from "@angular/core";

@Injectable()
export class NativeElementService {
  /**
   * Disable back and forward gestures in Safari
   *
   * https://stackoverflow.com/a/27023848
   *
   * @param nativeElement a div which has overflow attribute set in CSS
   */
  disableGestures(nativeElement) {
    // we should use Renderer2.listen(), but we can't inject Render2 here in the service
    // and this relies on the details of the native element anyway
    nativeElement.addEventListener("mousewheel", (event) => {
      // We don't want to scroll below zero or above the width
      const maxX = nativeElement.scrollWidth - nativeElement.offsetWidth;

      // If this event looks like it will scroll beyond the bounds of the element, prevent it and set the scroll to the boundary manually
      if (nativeElement.scrollLeft + event.deltaX < 0 || nativeElement.scrollLeft + event.deltaX > maxX) {
        event.preventDefault();

        // Manually set the scroll to the boundary
        nativeElement.scrollLeft = Math.max(0, Math.min(maxX, nativeElement.scrollLeft + event.deltaX));
      }
    });
  }
}
