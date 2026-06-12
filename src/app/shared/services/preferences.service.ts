import { Injectable } from "@angular/core";
import { User } from "chipster-js-common";
import log from "loglevel";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthenticationService } from "../../core/authentication/authentication-service";

@Injectable()
export class PreferencesService {
  public static readonly KEY_NEWS = "news";
  public static readonly KEY_NEWS_LAST_READ_TIME = "lastNewsReadTime";

  public static readonly KEY_LABELS = "labels";
  public static readonly KEY_LABELS_DISPLAY_MODE = "displayMode";
  public static readonly KEY_LABELS_SHOW_LABEL_PANEL = "showLabelPanel";

  constructor(private authenticationService: AuthenticationService) {}

  public updateNewsReadTime(readTime: Date): void {
    this.setPreferenceValue(PreferencesService.KEY_NEWS, PreferencesService.KEY_NEWS_LAST_READ_TIME, readTime, "news read time");
  }

  public getNewsReadTime(): Observable<Date> {
    return this.getPreferenceValue<Date>(PreferencesService.KEY_NEWS, PreferencesService.KEY_NEWS_LAST_READ_TIME);
  }

  public setLabelDisplayMode(mode: "dots" | "pills"): void {
    this.setPreferenceValue(PreferencesService.KEY_LABELS, PreferencesService.KEY_LABELS_DISPLAY_MODE, mode, "label display mode");
  }

  public getLabelDisplayMode(): Observable<"dots" | "pills" | null> {
    return this.getPreferenceValue<"dots" | "pills">(PreferencesService.KEY_LABELS, PreferencesService.KEY_LABELS_DISPLAY_MODE);
  }

  public setShowLabelPanel(value: boolean): void {
    this.setPreferenceValue(PreferencesService.KEY_LABELS, PreferencesService.KEY_LABELS_SHOW_LABEL_PANEL, value, "labels panel visibility");
  }

  public getShowLabelPanel(): Observable<boolean | null> {
    return this.getPreferenceValue<boolean>(PreferencesService.KEY_LABELS, PreferencesService.KEY_LABELS_SHOW_LABEL_PANEL);
  }

  private getPreferenceValue<T>(rootKey: string, leafKey: string): Observable<T | null> {
    return this.authenticationService
      .getUser()
      .pipe(map((user: User): T | null => (user.preferences?.[rootKey]?.[leafKey] as T) ?? null));
  }

  private setPreferenceValue(rootKey: string, leafKey: string, value: unknown, label: string): void {
    this.authenticationService.getUser().subscribe({
      next: (user: User) => {
        const preferences = user.preferences == null || user.preferences.length < 1 ? {} : user.preferences;
        preferences[rootKey] ??= {};
        preferences[rootKey][leafKey] = value;
        user.preferences = preferences;
        this.authenticationService.updateUser(user).subscribe({ next: () => log.info("update " + label + " done") });
      },
    });
  }
}
