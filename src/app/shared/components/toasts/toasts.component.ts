import { Component } from "@angular/core";
import { NgbToast } from "@ng-bootstrap/ng-bootstrap";
import { Toast, ToastService } from "../../services/toast.service";

/**
 * Shows the toasts of ToastService. There is one of these, in the AppComponent.
 *
 * NgbToast does the fading and the timer. Its timer starts over when autohide
 * changes, so pointing at the toast stops the timer and moving the pointer away
 * starts it from the beginning.
 */
@Component({
  selector: "ch-toasts",
  templateUrl: "./toasts.component.html",
  styleUrls: ["./toasts.component.less"],
})
export class ToastsComponent {
  // the toasts under the pointer
  hovered = new WeakSet<Toast>();

  constructor(public toastService: ToastService) {}

  action(toast: Toast, text: string, event: Event): void {
    // don't close the toast, if tapToDismiss is on
    event.stopPropagation();
    toast.action(text);
  }

  /*
   * The event handlers return nothing, because Angular calls preventDefault()
   * on the event when a handler returns false.
   */
  pointerLeft(toast: Toast): void {
    this.hovered.delete(toast);
  }

  dismiss(toast: Toast, ngbToast: NgbToast): void {
    if (toast.options.tapToDismiss) {
      ngbToast.hide();
    }
  }

  isTimerRunning(toast: Toast): boolean {
    return toast.options.timeout > 0 && !this.hovered.has(toast);
  }
}
