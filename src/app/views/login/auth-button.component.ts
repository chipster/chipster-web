import { Component, EventEmitter, Output, ChangeDetectionStrategy, input } from "@angular/core";

@Component({
  selector: "ch-auth-button",
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AuthButtonComponent {
  readonly name = input<string>(undefined);
  readonly logo = input<string>(undefined);
  readonly description = input<string>(undefined);

  @Output() selectAuth = new EventEmitter();

  public onSelect() {
    this.selectAuth.emit();
  }
}
