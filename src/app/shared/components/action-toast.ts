import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component } from "@angular/core";
import { Toast, ToastPackage, ToastrService } from "ngx-toastr";

/*
Component definition copied from the Toast source code, because this is how it done in the ngx-toastr example too
Added:
- display: block
- the button
*/
@Component({
  selector: "ch-action-toast-component",
  styles: [
    `
      :host {
        /* the default toast component is div */
        display: block;
      }
    `,
  ],
  template: `
    @if (options.closeButton) {
      <button (click)="remove()" class="toast-close-button" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    }
    @if (title) {
      <div [class]="options.titleClass" [attr.aria-label]="title">
        {{ title }}
        @if (duplicatesCount) {
          [{{ duplicatesCount + 1 }}]
        }
      </div>
    }
    @if (message && options.enableHtml) {
      <div
        role="alertdialog"
        aria-live="polite"
        [class]="options.messageClass"
      [innerHTML]="message"></div>
    }
    @if (message && !options.enableHtml) {
      <div
        role="alertdialog"
        aria-live="polite"
        [class]="options.messageClass"
        [attr.aria-label]="message">
        {{ message }}
      </div>
    }
    @if (options.progressBar) {
      <div>
        <div class="toast-progress" [style.width]="width + '%'"></div>
      </div>
    }
    
    <div class="row">
      @for (b of options['links']; track b) {
        <div>
          <button class="btn btn-toast btn-link pt-0" (click)="action(b.text, $event)">
            @if (b.icon) {
              <i [class]="b.icon"></i>
            }
            {{ b.text }}
          </button>
        </div>
      }
    </div>
    
    <div class="row">
      <div class="mt-2 ps-0 pe-0">
        <span class="float-end">
          @for (b of options['buttons']; track b) {
            <button
              class="btn btn-sm ms-2 mt-2 {{ b.class || 'btn-secondary' }}"
              (click)="action(b.text, $event)">
              @if (b.icon) {
                <i [class]="b.icon"></i>
              }
              {{ b.text }}
            </button>
          }
        </span>
      </div>
    </div>
    `,
  animations: [
    trigger("flyInOut", [
      state("inactive", style({ opacity: 0 })),
      state("active", style({ opacity: 1 })),
      state("removed", style({ opacity: 0 })),
      transition("inactive => active", animate("{{ easeTime }}ms {{ easing }}")),
      transition("active => removed", animate("{{ easeTime }}ms {{ easing }}")),
    ]),
  ],
  preserveWhitespaces: false,
})
export class ActionToastComponent extends Toast {
  // constructor is only necessary when not using AoT
  constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
    super(toastrService, toastPackage);
  }

  action(buttonText: string, event: Event): boolean {
    event.stopPropagation();
    this.toastPackage.triggerAction(buttonText);
    return false;
  }
}
