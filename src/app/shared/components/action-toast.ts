import { Component } from "@angular/core";
import {
    animate,
    state,
    style,
    transition,
    trigger
  } from '@angular/animations';
import { ToastrService, ToastPackage, Toast } from "ngx-toastr";

/*
Component definition copied from the Toast source code, because this is how it done in the ngx-toastr example too
Added:
- display: block
- the button
*/
@Component({
    selector: 'ch-action-toast-component',
    styles: [`
    :host {
      /* the default toast component is div */
      display: block
    }`],
    template: `
    <button *ngIf="options.closeButton" (click)="remove()" class="toast-close-button" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    <div *ngIf="title" [class]="options.titleClass" [attr.aria-label]="title">
        {{ title }}
    </div>
    <div *ngIf="message && options.enableHtml" role="alertdialog" aria-live="polite"
        [class]="options.messageClass" [innerHTML]="message">
    </div>
    <div *ngIf="message && !options.enableHtml" role="alertdialog" aria-live="polite"
        [class]="options.messageClass" [attr.aria-label]="message">
        {{ message }}
    </div>
    <div *ngIf="options.progressBar">
        <div class="toast-progress" [style.width]="width + '%'"></div>
    </div>
    <div class="row">
        <div *ngFor="let b of options['buttons']">
            <button class="btn btn-sm btn-toast ml-3 px-3 {{b.class || 'btn-secondary'}}"
            (click)="action(b.text, $event)">
                <i *ngIf="b.icon" [class]="b.icon"></i>
                {{ b.text }}
            </button>
        </div>
    </div>
    `,
    animations: [
        trigger('flyInOut', [
        state(
            'inactive',
            style({
            display: 'none',
            opacity: 0
            })
        ),
        state('active', style({})),
        state('removed', style({ opacity: 0 })),
        transition(
            'inactive => active',
            animate('{{ easeTime }}ms {{ easing }}')
        ),
        transition('active => removed', animate('{{ easeTime }}ms {{ easing }}'))
        ])
    ],
    preserveWhitespaces: false
})
export class ActionToastComponent extends Toast {

    // constructor is only necessary when not using AoT
    constructor(
        protected toastrService: ToastrService,
        public toastPackage: ToastPackage,
    ) {
        super(toastrService, toastPackage);
    }

    action(buttonText: string, event: Event) {
        event.stopPropagation();
        this.toastPackage.triggerAction(buttonText);
        return false;
    }
}
