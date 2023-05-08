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
    <button *ngIf="options.closeButton" (click)="remove()" class="toast-close-button" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
    <div *ngIf="title" [class]="options.titleClass" [attr.aria-label]="title">
      {{ title }}
      <ng-container *ngIf="duplicatesCount">[{{ duplicatesCount + 1 }}]</ng-container>
    </div>
    <div
      *ngIf="message && options.enableHtml"
      role="alertdialog"
      aria-live="polite"
      [class]="options.messageClass"
      [innerHTML]="message"></div>
    <div
      *ngIf="message && !options.enableHtml"
      role="alertdialog"
      aria-live="polite"
      [class]="options.messageClass"
      [attr.aria-label]="message">
      {{ message }}
    </div>
    <div *ngIf="options.progressBar">
      <div class="toast-progress" [style.width]="width + '%'"></div>
    </div>

    <div class="row">
      <div *ngFor="let b of options['links']">
        <button class="btn btn-toast btn-link pt-0" (click)="action(b.text, $event)">
          <i *ngIf="b.icon" [class]="b.icon"></i>
          {{ b.text }}
        </button>
      </div>
    </div>

    <div class="row">
      <div class="mt-2 ps-0 pe-0">
        <span class="float-end">
          <button
            *ngFor="let b of options['buttons']"
            class="btn btn-sm ms-2 mt-2 {{ b.class || 'btn-secondary' }}"
            (click)="action(b.text, $event)">
            <i *ngIf="b.icon" [class]="b.icon"></i>
            {{ b.text }}
          </button>
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
