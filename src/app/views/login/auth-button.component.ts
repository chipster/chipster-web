import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "ch-auth-button",
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
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
