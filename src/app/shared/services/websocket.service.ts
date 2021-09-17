import { Injectable } from "@angular/core";
import { SessionEvent, WsEvent } from "chipster-js-common";
import log from "loglevel";
import { EMPTY, Observable, Subject, throwError as observableThrowError } from "rxjs";
import { catchError, mergeMap } from "rxjs/operators";
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ErrorButton, ErrorMessage } from "../../core/errorhandler/errormessage";
import { ConfigService } from "./config.service";

@Injectable()
export class WebSocketService {
  topic: string;

  datasetStream$: Observable<SessionEvent>;
  jobStream$: Observable<SessionEvent>;
  sessionStream$: Observable<SessionEvent>;
  ruleStream$: Observable<SessionEvent>;
  wsSubject$: WebSocketSubject<WsEvent>;
  localSubject$: Subject<WsEvent>;

  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
    private errorService: ErrorService
  ) {}

  unsubscribe() {
    // can be null when session loading fails (e.g. expired token)
    if (this.wsSubject$) {
      this.wsSubject$.unsubscribe();
    }
    // topic is used as a flag for cancelling the reconnection
    this.topic = null;
  }

  /**
   * Connect to websocket and copy events to the listener Subject
   *
   * There are two Subjects, the listener Subject and
   * the real websocket Subject. The listener Subject collects the subscriptions, while the websocket
   * Subject is kept hidden behing the scenes. All received websocket messages are pushed to the listener
   * Subject. When the websocket Subject completes beause of the server's
   * idle timeout, we can simply create a new websocket Subject, without loosing the current subscriptions.
   */
  connect(listener, topic: string) {
    this.topic = topic;

    // get the url of the websocket server
    this.configService
      .getSessionDbEventsUrl()
      .pipe(
        mergeMap((eventsUrl: string) => {
          const encodedTopic = encodeURIComponent(this.topic);
          const wsUrl = `${eventsUrl}/events/${encodedTopic}?token=${this.tokenService.getToken()}`;
          log.debug("event URL", wsUrl);

          // convert websocket to observable
          // Need to check whether this new webSocket works!!!!!!
          this.wsSubject$ = webSocket({
            url: wsUrl,
            openObserver: {
              next: (x) => {
                log.info("websocket open", x);
              },
            },
          });

          return this.wsSubject$;
        }),
        // convert unclean idle timeouts to clean (about 20% of them for unknown reason)
        catchError((err) => {
          if (err.code === 1001 && err.reason === "Idle Timeout") {
            return EMPTY;
          }
          return observableThrowError(err);
        })
      )
      .subscribe(
        (data) => {
          log.info("websocket event", data);
          listener.next(data);
        },
        (err) => {
          log.info("websocket error", err);
          this.errorService.showErrorObject(
            new ErrorMessage(
              null,
              "Connection lost, please reload the page.",
              false,
              [ErrorButton.Reload],
              [ErrorButton.ShowDetails],
              err
            )
          );
        },
        () => {
          log.info("websocket closed");
          // if not unsubscribed
          if (this.topic) {
            // reconnect after clean close (server idle timeout)
            this.connect(listener, topic);
          }
        }
      );
  }

  /**
   * Handle a locally generated event just like the real events coming from the websocket.
   *
   * Through this the client can be tricked to show different state from the server. Obviously
   * should be used only for quick hacks.
   *
   * @param event
   */
  generateLocalEvent(event: WsEvent) {
    // incorrect typing? it really is an object, but the compiler wants a string
    this.localSubject$.next(event);
  }
}
