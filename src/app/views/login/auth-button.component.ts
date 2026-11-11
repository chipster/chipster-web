import { Component, input, output } from "@angular/core";

@Component({
  selector: "ch-auth-button",
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.less"],
})
export class AuthButtonComponent {
  readonly name = input<string>(undefined);
  readonly logo = input<string>(undefined);
  readonly description = input<string>(undefined);

  readonly selectAuth = output<void>();

  public onSelect() {
    this.selectAuth.emit();
  }
}
