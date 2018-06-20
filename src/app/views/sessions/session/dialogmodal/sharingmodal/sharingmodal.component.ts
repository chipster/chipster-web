import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild, OnChanges, OnInit} from "@angular/core";
import {ActivatedRoute, Router, UrlTree} from "@angular/router";
import {Store} from "@ngrx/store";
import Session from "../../../../../model/session/session";
import Dataset from "../../../../../model/session/dataset";
import Rule from "../../../../../model/session/rule";
import { TokenService } from "../../../../../core/authentication/token.service";
import { SessionDataService } from "../../sessiondata.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionEventService } from "../../sessionevent.service";
import { RouteService } from "../../../../../shared/services/route.service";

@Component({
  templateUrl: './sharingmodal.component.html'
})
export class SharingModalComponent implements AfterViewInit, OnInit {

  @Input() session: Session;

  @ViewChild('submitButton') submitButton;
  @ViewChild('usernameInput') usernameInput;

  public rules: Rule[];
  public newRule: Rule;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<any>,
    private activeModal: NgbActiveModal,
    private tokenService: TokenService,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    private sessionEventService: SessionEventService,
    private routeService: RouteService) { }

  ngOnInit() {
    this.rules = this.session.rules;
    this.sessionEventService.getRuleStream()
      .subscribe(() => {
        this.rules = this.session.rules;
      });
  }

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    this.submitButton.nativeElement.focus();
  }

  save() {
    this.activeModal.close(this.session.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }

  saveRule() {
    this.sessionDataService.createRule(this.newRule)
      .subscribe(resp => {
        console.log(resp);
        this.newRule = null;

      }, err => this.restErrorService.handleError(err, 'failed to add a new rule'));
  }

  addNewRule() {
    this.newRule = new Rule();
    this.newRule.readWrite = true;
    // setTimeout() makes this async so that the element is added to the dom before we try to get it
    setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }

  deleteRule(ruleId: string) {
    this.sessionDataService.deleteRule(ruleId)
      .subscribe(resp => console.log('rule deleted'),
        err => this.restErrorService.handleError(err, 'failed to delete the rule'));
  }

  getUsername() {
    return this.tokenService.getUsername();
  }

  isDeleteEnabled(rule: Rule) {
    return this.tokenService.getUsername() !== rule.username;
  }
}
