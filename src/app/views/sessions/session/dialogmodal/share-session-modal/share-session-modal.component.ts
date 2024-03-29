import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Rule, Session, SessionEvent } from "chipster-js-common";
import log from "loglevel";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { TokenService } from "../../../../../core/authentication/token.service";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../../../shared/resources/session.resource";

@Component({
  templateUrl: "./share-session-modal.component.html",
})
export class SharingModalComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input()
  session: Session;
  @Input()
  ruleStream$: Observable<SessionEvent>;

  @ViewChild("submitButton")
  submitButton;
  @ViewChild("usernameInput")
  usernameInput;

  public rules: Rule[];
  public newRule: Rule;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private activeModal: NgbActiveModal,
    private tokenService: TokenService,
    private restErrorService: RestErrorService,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
  ) {}

  ngOnInit() {
    this.rules = this.session.rules;
    this.ruleStream$.pipe(takeUntil(this.unsubscribe)).subscribe(
      () => {
        this.rules = this.session.rules;
      },
      (err) => this.errorService.showError("getting rule events failed", err),
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.submitButton.nativeElement.focus();
    });
  }

  save() {
    this.activeModal.close(this.session.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }

  saveRule() {
    this.newRule.username = this.newRule.username.trim();
    this.sessionResource.createRule(this.session.sessionId, this.newRule).subscribe(
      (resp) => {
        log.info("rule created", resp);
        this.newRule = null;
      },
      (err) => this.restErrorService.showError("failed to add a new rule", err),
    );
  }

  addNewRule() {
    this.newRule = new Rule();
    this.newRule.readWrite = true;
    // setTimeout() makes this async so that the element is added to the dom before we try to get it
    setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }

  deleteRule(ruleId: string) {
    this.sessionResource.deleteRule(this.session.sessionId, ruleId).subscribe(
      (resp) => log.info("rule deleted"),
      (err) => this.restErrorService.showError("failed to delete the rule", err),
    );
  }

  getUsername() {
    return this.tokenService.getUsername();
  }

  isDeleteEnabled(rule: Rule) {
    return this.tokenService.getUsername() !== rule.username;
  }
}
