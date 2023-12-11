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

  constructor(private authenticationService: AuthenticationService) {}

  public updateNewsReadTime(readTime: Date): void {
    this.authenticationService.getUser().subscribe({
      next: (user: User) => {
        const preferences = user.preferences == null || user.preferences.length < 1 ? {} : user.preferences;

        // add news if it's missing
        if (preferences[PreferencesService.KEY_NEWS] == null) {
          preferences[PreferencesService.KEY_NEWS] = {};
        }

        // set news read time
        preferences[PreferencesService.KEY_NEWS][PreferencesService.KEY_NEWS_LAST_READ_TIME] = readTime;

        // update to backend
        user.preferences = preferences;
        this.authenticationService.updateUser(user).subscribe({ next: () => log.info("update new read time done") });
      },
    });
  }

  public getNewsReadTime(): Observable<Date> {
    return this.authenticationService
      .getUser()
      .pipe(
        map(
          (user: User): Date =>
            user.preferences != null && user.preferences[PreferencesService.KEY_NEWS] != null
              ? user.preferences[PreferencesService.KEY_NEWS][PreferencesService.KEY_NEWS_LAST_READ_TIME]
              : null
        )
      );
  }
}
