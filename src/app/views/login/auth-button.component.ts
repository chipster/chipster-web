import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "ch-auth-button",
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.less"],
})
export class AuthButtonComponent {
  @Input() name: string;
  @Input() logo: string;
  @Input() description: string;

  @Output() selectAuth = new EventEmitter();

  public onSelect() {
    this.selectAuth.emit();
  }
}
