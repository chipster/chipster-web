import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  OnInit,
  OnDestroy
} from "@angular/core";
import { Session, Rule, SessionEvent } from "chipster-js-common";
import { TokenService } from "../../../../../core/authentication/token.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../../../shared/resources/session.resource";
import { Observable, Subject } from "rxjs";
import log from "loglevel";

@Component({
  templateUrl: "./sharingmodal.component.html"
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
  ) {}

  ngOnInit() {
    this.rules = this.session.rules;
    this.ruleStream$
      .takeUntil(this.unsubscribe)
      .subscribe(() => {
      this.rules = this.session.rules;
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
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
    this.sessionResource.createRule(this.session.sessionId, this.newRule).subscribe(
      resp => {
        log.info("rule created", resp);
        this.newRule = null;
      },
      err => this.restErrorService.handleError(err, "failed to add a new rule")
    );
  }

  addNewRule() {
    this.newRule = new Rule();
    this.newRule.readWrite = true;
    // setTimeout() makes this async so that the element is added to the dom before we try to get it
    setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }

  deleteRule(ruleId: string) {
    this.sessionResource.deleteRule(this.session.sessionId, ruleId)
      .subscribe(
        resp => log.info("rule deleted"),
        err =>
          this.restErrorService.handleError(err, "failed to delete the rule")
      );
  }

  getUsername() {
    return this.tokenService.getUsername();
  }

  isDeleteEnabled(rule: Rule) {
    return this.tokenService.getUsername() !== rule.username;
  }
}
