import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  AfterViewInit,
  ViewChild,
  OnInit,
  Inject,
  Input
} from "@angular/core";
import { Session, Rule, User } from "chipster-js-common";
import { mergeMap, tap, map } from "rxjs/operators";
import { of, Observable } from "rxjs";
import { DOCUMENT } from "@angular/platform-browser";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { UserService } from "../../../shared/services/user.service";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { ConfigService } from "../../../shared/services/config.service";
import { DialogModalService } from "../../sessions/session/dialogmodal/dialogmodal.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { RouteService } from "../../../shared/services/route.service";
import { SessionData } from "../../../model/session/session-data";
import { FormBuilder, Validators, AbstractControl, FormControl } from "@angular/forms";

@Component({
  templateUrl: "./contact-support-modal.component.html",
  styleUrls: ["./contact-support-modal.component.less"]
})
export class ContactSupportModalComponent implements AfterViewInit, OnInit {

  public supportForm = this.fb.group({
    message: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    attach: ['', [Validators.required]], // force user the the select
  });

  @Input()
  log: string;

  @ViewChild("messageTextarea")
  messageTextarea;

  public session: Session;
  public user: User;
  public isVerifiedEmail = false;

  constructor(
    private activeModal: NgbActiveModal,
    private sessionWorkerResource: SessionWorkerResource,
    private restErrorService: RestErrorService,
    private userService: UserService,
    private sessionResource: SessionResource,
    private authenticationService: AuthenticationService,
    private routeService: RouteService,
    private configService: ConfigService,
    private dialogModalService: DialogModalService,
    private fb: FormBuilder,
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
          this.supportForm.patchValue({
            attach: "no"
          });
          this.supportForm.controls.attach.disable();
        }
      }),
      mergeMap(() => this.authenticationService.getUser()),
      tap((user: User) => {
        this.user = user;
        if (user.mail != null) {
          this.supportForm.patchValue({
            email: user.mail
          });
          this.isVerifiedEmail = true;
        }
      }),
    ).subscribe(null, err => this.restErrorService.showError("support modal initialization failed", err));
  }

  ngAfterViewInit() {
    // setTimeout() to avoid scrolling in the current Bootstrap version
    setTimeout(() => {
      this.messageTextarea.nativeElement.focus();
    }, 0);
  }

  onSubmit() {

    if (this.supportForm.valid) {
      let copySessionId$: Observable<string>;

      if (this.session != null && this.supportForm.value.attach === "yes") {
        copySessionId$ = this.copyToSupportSessions(this.session.sessionId);
      } else {
        copySessionId$ = of(null);
      }

      const supportRequest$ = copySessionId$.pipe(
        mergeMap((sessionUrl: string) => {
          console.log("support session url", sessionUrl);
          return this.sessionWorkerResource.supportRequest(
            this.supportForm.value.message,
            sessionUrl,
            this.supportForm.value.email,
            this.routeService.getAppRouteCurrent(),
            this.log);
        }),
      );

      this.activeModal.close();

      this.dialogModalService.openSpinnerModal(
        "Sending the support request",
        supportRequest$
      );
    }
  }

  getHostUrl() {
    // get the url of the app server
    // the current url is correct also when using "ng serve" (unlike the one from service-locator)
    let url = this.document.location.protocol + "//" + this.document.location.hostname;
    if (this.document.location.port != null) {
      url += ":" + this.document.location.port;
    }
    return url;
  }

  /**
   * returns the url of the new session
   */
  copyToSupportSessions(sessionId: string): Observable<string> {
    let sessionData: SessionData;
    let copySessionId: string;
    const userId = this.user.auth + "/" + this.user.username;
    const utcDate = new Date().toISOString().split('T')[0];
    const appHostUrl = this.document.location.protocol + "//" + this.document.location.hostname;

    // the "preview" version of the sessionData is enough
    return this.sessionResource.loadSession(sessionId, true).pipe(
      mergeMap((data: SessionData) => {
        sessionData = data;
        const name = utcDate + "_" + userId + "_" + sessionData.session.name;
        return this.sessionResource.copySession(sessionData, name, false);
      }),
      tap((id: string) => {
        copySessionId = id;
      }),
      mergeMap(() => this.configService.get(ConfigService.KEY_SUPPORT_SESSION_OWNER_USER_ID)),
      mergeMap((supportSessionOwner: string) => {
        // share the session to the special user
        const rule = new Rule();
        rule.readWrite = true;
        rule.username = supportSessionOwner;
        return this.sessionResource.createRule(copySessionId, rule);
      }),
      map(() => {
        // return the url of the new session
        const appRoute = this.routeService.getAppRouteCurrent();
        return this.getHostUrl() + "/" + appRoute + "/analyze/" + copySessionId;
      }),
    );
  }

  cancel() {
    this.activeModal.dismiss();
  }

  isValidationError(control: AbstractControl) {
    return control.invalid && (control.dirty || control.touched);
  }

  get message() {
    return this.supportForm.get('message') as FormControl;
  }

  get attach() {
    return this.supportForm.get('attach') as FormControl;
  }

  get email() {
    return this.supportForm.get('email') as FormControl;
  }
}
