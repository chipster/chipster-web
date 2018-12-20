import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  Inject
} from "@angular/core";
import { Session, Rule, User, Role } from "chipster-js-common";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionWorkerResource } from "../../../../../shared/resources/sessionworker.resource";
import { UserService } from "../../../../../shared/services/user.service";
import { mergeMap, tap, map } from "rxjs/operators";
import { SessionResource } from "../../../../../shared/resources/session.resource";
import { AuthenticationService } from "../../../../../core/authentication/authentication-service";
import { of, Observable } from "rxjs";
import { SessionData } from "../../../../../model/session/session-data";
import { ConfigService } from "../../../../../shared/services/config.service";
import { DOCUMENT } from "@angular/platform-browser";
import { RouteService } from "../../../../../shared/services/route.service";

@Component({
  templateUrl: "./contact-support-modal.component.html",
  styleUrls: ["./contact-support-modal.component.less"]
})
export class ContactSupportModalComponent implements AfterViewInit, OnInit {

  @ViewChild("messageTextarea")
  messageTextarea;

  public message = "";
  public email = "";
  public attach: string; // force user the the select

  public session: Session;
  public user: User;
  public isVerifiedEmail = false;
  public formSubmitAttempt = false;
  public isSending = false;

  constructor(
    private activeModal: NgbActiveModal,
    private sessionWorkerResource: SessionWorkerResource,
    private restErrorService: RestErrorService,
    private userService: UserService,
    private sessionResource: SessionResource,
    private authenticationService: AuthenticationService,
    private routeService: RouteService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document,
  ) { }

  ngOnInit() {

    this.userService.getLatestSession().pipe(
      mergeMap((sessionId: string) => {
        if (sessionId != null) {
          return this.sessionResource.getSession(sessionId);
        }
        return of(null);
      }),
      tap(session => {
        this.session = session;
        if (this.session == null) {
          this.attach = "no";
        }
      }),
      mergeMap(() => this.authenticationService.getUser()),
      tap((user: User) => {
        this.user = user;
        if (user.mail != null) {
          this.email = user.mail;
          this.isVerifiedEmail = true;
        }
      }),
    ).subscribe(null, err => this.restErrorService.handleError(err));
  }

  ngAfterViewInit() {
    // setTimeout() to avoid scrolling in the current Bootstrap version
    setTimeout(() => {
      this.messageTextarea.nativeElement.focus();
      // workaround because Angular template based forms
      // don't like programmatic changes https://github.com/angular/angular/issues/22426
      this.cdr.detectChanges();
    }, 0);
  }

  save(form) {
    this.formSubmitAttempt = true;

    if (form.valid) {

      this.isSending = true;
      let copySessionId$: Observable<string>;

      if (this.session != null && this.attach === "yes") {
        copySessionId$ = this.copyToSupportSessions(this.session.sessionId);
      } else {
        copySessionId$ = of(null);
      }

      copySessionId$.pipe(
        mergeMap((sessionUrl: string) => {
          console.log("support session url", sessionUrl);
          return this.sessionWorkerResource.supportRequest(this.message, sessionUrl, this.email);
        }),
      ).subscribe(resp => {
        this.activeModal.close();
      }, err => {
        this.isSending = false;
        this.restErrorService.handleError(err);
      });
    }
  }

  /**
   * returns the url of the new session
   */
  copyToSupportSessions(sessionId: string): Observable<string> {
    let sessionData: SessionData;
    let copySessionId: string;
    const userId = this.user.auth + "/" + this.user.username;
    const utcDate = new Date().toISOString().split('T')[0];
    // get the url of the app server
    // the current url is correct also when using "ng serve"
    const appHostUrl = this.document.location.protocol + "//" + this.document.location.hostname + ":" + this.document.location.port;

    // the "preview" version of the sessionData is enough
    return this.sessionResource.loadSession(sessionId, true).pipe(
      mergeMap((data: SessionData) => {
        sessionData = data;
        const name = utcDate + "_" + userId + "_" + sessionData.session.name;
        return this.sessionResource.copySession(sessionData, name, false);
      }),
      mergeMap((id: string) => {
        copySessionId = id;
        // share the session to the special user
        const rule = new Rule();
        rule.readWrite = true;
        //FIXME make configurable
        rule.username = "jaas/support_session_owner";
        return this.sessionResource.createRule(copySessionId, rule);
      }),
      // find out the ruleId of user's own rule to delete it
      mergeMap(() => this.sessionResource.getSession(copySessionId)),
      mergeMap((session: Session) => {
        const usersRule = session.rules.find(r => r.username === userId);
        return this.sessionResource.deleteRule(copySessionId, usersRule.ruleId);
      }),
      map(() => {
        // return the url of the new session
        const appRoute = this.routeService.getAppRouteCurrent();
        return appHostUrl + "/" + appRoute + "/analyze/" + copySessionId;
      }),
    );
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
