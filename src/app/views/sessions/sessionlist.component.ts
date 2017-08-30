
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";
import {Subject} from "rxjs";
import {TokenService} from "../../core/authentication/token.service";
import Rule from "../../model/session/rule";

@Component({
  selector: 'ch-session-list',
  templateUrl: './sessionlist.html',
  styleUrls: ['./sessionlist.less']
})
export class SessionListComponent {

    public previewedSession: Session;
    public previousSession: Session;
    public sessionsByUserKeys: Array<string>;
    public sessionsByUser: Map<string, Array<Session>>;
    public sessionData: SessionData;
    private selectedSessionId: string;
    private workflowPreviewLoading = false;

    private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

    constructor(
        private router: Router,
        private sessionResource: SessionResource,
        private dialogModalService: DialogModalService,
        private tokenService: TokenService) {}

    ngOnInit() {
      this.updateSessions();

      this.previewThrottleSubscription = this.previewThrottle$.asObservable()
        // hide the loading indicator of the old session immediately
        .do(() => this.workflowPreviewLoading = false)
        // wait a while to see if the user is really intersted about this session
        .debounceTime(500)
        // in switchMap the new request cancels the previous requests
        .switchMap(session => {
          this.workflowPreviewLoading = true;
          return this.sessionResource.loadSession(session.sessionId)
        })
        .do((fullSession: SessionData) => {
          this.workflowPreviewLoading = false;
          // don't show if the selection has already changed
          if (this.previewedSession.sessionId === fullSession.session.sessionId) {
            this.sessionData = fullSession;
          }
        })
        // hide the spinner when unsubscribed (when the user has opened a session)
        .finally(() => this.workflowPreviewLoading = false)
        .subscribe();
    }

    createSession() {

        let session = new Session('New session');
        this.sessionResource.createSession(session).subscribe((sessionId: string) => {
                session.sessionId = sessionId;
                this.openSession(sessionId);
        });
    }

    updateSessions() {

        this.sessionResource.getSessions().subscribe((sessions: Session[]) => {

            let sessionsByUser = new Map();
            // show user's own sessions first
            sessionsByUser.set(null, []);

            sessions.forEach(s => {
              this.getApplicableRules(s.rules).forEach(rule => {
                if (!sessionsByUser.has(rule.sharedBy)) {
                  sessionsByUser.set(rule.sharedBy, []);
                }
                sessionsByUser.get(rule.sharedBy).push(s);
              });
            });

            this.sessionsByUser = sessionsByUser;
            this.sessionsByUserKeys = Array.from(sessionsByUser.keys());
        });
    }

    openSession(sessionId: string) {
      this.previewThrottleSubscription.unsubscribe();
      this.selectedSessionId = sessionId;
      this.router.navigate(['/sessions', sessionId]);
    }

    sessionsUploaded(sessionIds: string[]) {
      if (sessionIds.length === 1) {
        this.openSession(sessionIds[0]);
      } else {
        this.updateSessions();
      }
    }

    previewSession(session: Session) {
        this.previewedSession = session;

        if (this.previewedSession) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.sessionData = null;
                this.previewThrottle$.next(session);
            }
        }
    }

    deleteSession(session: Session) {

      this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + session.name + '?', 'Delete', 'Cancel').then(() => {
        //this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
        // delete the session only from this user (i.e. the rule)
        this.sessionResource.deleteRule(session.sessionId, this.getDeletableRules(session.rules)[0].ruleId).subscribe( () => {
          this.updateSessions();
          this.previewedSession = null;
        }, () => {
          console.error('Error in deleting session');
        });
      }, () => {
        // modal dismissed
      });
    }

    hasReadWriteAccess(rules: Array<Rule>) {
      rules.forEach(r => {
        if (r.readWrite) {
          return true;
        }
      });
      return false;
    }

    getDeletableRules(rules: Array<Rule>) {
      if (this.hasReadWriteAccess(rules)) {
        return this.getApplicableRules(rules);
      } else {
        return this.getPersonalRules(rules);
      }
    }

    canDeleteRule(rules: Array<Rule>) {
      return this.getDeletableRules(rules).length > 0;
    }

    getPersonalRules(rules: Array<Rule>) {
      return rules.filter(r => r.username === this.tokenService.getUsername());
    }

    getPublicRules(rules: Array<Rule>) {
      return rules.filter(r => r.username === 'everyone');
    }

    getApplicableRules(rules: Array<Rule>) {
      return this.getPersonalRules(rules).concat(this.getPublicRules(rules));
    }

    isSessionSelected(session: Session) {
        return this.selectedSessionId === session.sessionId;
    }
}
