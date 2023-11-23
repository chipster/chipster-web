import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Role } from "chipster-js-common";
import { Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
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
}
