import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  OnInit,
  ChangeDetectorRef
} from "@angular/core";
import { Session, Rule, User } from "chipster-js-common";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionWorkerResource } from "../../../../../shared/resources/sessionworker.resource";
import { UserService } from "../../../../../shared/services/user.service";
import { mergeMap, tap } from "rxjs/operators";
import { SessionResource } from "../../../../../shared/resources/session.resource";
import { AuthenticationService } from "../../../../../core/authentication/authentication-service";

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
  public isVerifiedEmail = false;
  public formSubmitAttempt = false;

  constructor(
    private activeModal: NgbActiveModal,
    private sessionWorkerResource: SessionWorkerResource,
    private restErrorService: RestErrorService,
    private userService: UserService,
    private sessionResource: SessionResource,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {

    this.userService.getLatestSession().pipe(
      mergeMap((sessionId: string) => this.sessionResource.getSession(sessionId)),
      tap(session => {
        this.session = session;
        if (this.session == null) {
          this.attach = "no";
        }
      }),
      mergeMap(() => this.authenticationService.getUser()),
      tap((user: User) => {
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

      const sessionId = this.session ? this.session.sessionId : null;

      this.sessionWorkerResource.supportRequest(this.message, sessionId, this.email)
        .subscribe(resp => {
          this.activeModal.close(this.session.notes);
        }, err => this.restErrorService.handleError(err));
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
