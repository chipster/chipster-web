import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Role } from "chipster-js-common";
import { Observable, of } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";
import { AuthHttpClientService } from "./auth-http-client.service";
import { ConfigService } from "./config.service";

@Injectable()
export class SessionDbAdminService {
  constructor(private configService: ConfigService, private authHttpClient: AuthHttpClientService) {}

  deleteSessions(...userId: string[]): Observable<any> {
    return this.configService.getAdminUri(Role.SESSION_DB).pipe(
      mergeMap((sessionDbAdminUrl: string) => {
        let httpParams = new HttpParams();
        userId.forEach((id) => {
          httpParams = httpParams.append("userId", id);
        });

        const url = sessionDbAdminUrl + "/admin/users/sessions";
        return this.authHttpClient.deleteAuth(url, httpParams);
      })
    );
  }

  getQuotas(...userId: string[]): Observable<any> {
    let sessionDbAdminUrl: string;

    const sessionDbUsers$ = this.configService.getAdminUri(Role.SESSION_DB).pipe(
      tap((uri: string) => {
        sessionDbAdminUrl = uri;
      }),
      mergeMap(() => this.configService.getSessionDbUrl()),
      mergeMap((sessionDbUrl) => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
      mergeMap((users: string[]) => {
        // returning [] messes up the forkJoin later on
        if (users == null || users.length === 0) {
          return of([]);
        }

        // get quotas
        let httpParams = new HttpParams();
        userId.forEach((id) => {
          httpParams = httpParams.append("userId", id);
        });

        const url = sessionDbAdminUrl + "/admin/users/quota";
        return this.authHttpClient.getAuth(url, httpParams);
      })
    );

    return sessionDbUsers$;
  }
}
