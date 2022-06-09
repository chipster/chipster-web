import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Role } from "chipster-js-common";
import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { TokenService } from "../../core/authentication/token.service";
import { DialogModalService } from "../../views/sessions/session/dialogmodal/dialogmodal.service";
import { NotificationItem } from "../components/notifications/NotificationItem";
import { ConfigService } from "./config.service";

@Injectable()
export class NotificationsService {
  constructor(
    private dialogModalService: DialogModalService,
    private configService: ConfigService,
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}

  public openModalAndUploadNotification(notification?: NotificationItem): Observable<any> {
    const action$ = this.dialogModalService.openEditNotificationModal(notification).pipe(
      mergeMap((editedNotification: NotificationItem) => {
        if (notification == null) {
          return this.addNotification(editedNotification);
        }
        return this.updateNotification(editedNotification);
      })
    );

    // this.dialogModalService.openSpinnerModal("Saving notification", action$).subscribe({
    //   next: (result) => log.info("add notification done", result),
    //   error: (error) => log.warn("add notification failed", error),
    // });

    // action$.subscribe({
    //   next: (result) => log.info("add notification done", result),
    //   error: (error) => log.warn("add notification failed", error),
    // });
    return action$;
  }

  public getNotifications(): Observable<NotificationItem[]> {
    console.log("get notifications");
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => {
        const response = this.httpClient.get<NotificationItem[]>(`${url}/news`, this.tokenService.getTokenParams(true));
        console.log(response);
        return response;
      })
    );
  }

  public addNotification(notification: NotificationItem) {
    console.log("upload new notification");
    return this.configService.getAdminUri(Role.SESSION_DB).pipe(
      mergeMap((url: string) =>
        this.httpClient.post(
          `${url}/admin/notifications/${notification.id}/`,
          notification,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: NotificationItem) => response.id)
    );

    // return of(true);
  }

  public updateNotification(notification: NotificationItem) {
    console.log("upload edited notification");
    return this.configService.getAdminUri(Role.SESSION_DB).pipe(
      mergeMap((url: string) =>
        this.httpClient.put(
          `${url}/admin/notifications/${notification.id}/`,
          notification,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: NotificationItem) => response.id)
    );

    // return of(true);
  }

  public deleteNotification(notification: NotificationItem) {
    console.log("send delete notification");
    return this.configService.getAdminUri(Role.SESSION_DB).pipe(
      mergeMap((url: string) =>
        this.httpClient.delete(`${url}/admin/notifications/${notification.id}/`, this.tokenService.getTokenParams(true))
      ),
      map((response: NotificationItem) => response.id)
    );

    // return of(true);
  }

  public getExampleNotifications(): NotificationItem[] {
    return [
      {
        id: uuidv4(),
        shortTitle: "New release",
        title: "New version released",
        date: new Date(),
        message:
          '<p>Great new <a href="https://chipster.rahtiapp.fi/manual">version</a>  asldjfaslk jfölasjk dfölkjaslökdfj ölasjkfdölksajdföl jaöslkdjf ölksja dflökjaslödkfj lösakjdf ljas ödlfkj lk.</p> <p> More information <a href="https://chipster.rahtiapp.fi/manual">here</a>.</p>',
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
      {
        id: uuidv4(),
        title: "Service break",
        date: new Date(),
        message: "Everything is broken.",
      },
    ];
  }
}
