import { Injectable, Type, inject } from "@angular/core";
import { NgbModal, NgbModalOptions, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, SessionEvent, Tool } from "chipster-js-common";
import { EMPTY, Observable, from as observableFrom } from "rxjs";
import { catchError } from "rxjs/operators";
import { SessionData } from "../../../../model/session/session-data";
import { NewsItem } from "../../../../shared/components/news/NewsItem";

type Modals = typeof import("./modals");

@Injectable({ providedIn: "root" })
export class DialogModalService {
  private modalService = inject(NgbModal);

  /*
   * The modals are loaded with a dynamic import() of modals.ts, not imported at the top of
   * this file. A modal imports the components of its template, and many of those inject this
   * service, so a static import here would be an import cycle: a component in an import cycle
   * can be undefined when a decorator that imports it runs (NG0919), depending on the order in
   * which the bundler evaluates the files. An import() is not an edge of that graph: the
   * bundler puts the modals in a chunk of their own, evaluated after the main bundle. The chunk
   * loads when this service is created, so it is there before the user can click anything, and
   * a modal opens within the click as before.
   */
  private modals = import("./modals");

  static observableFromPromiseWithDismissHandling(result: Promise<any>) {
    return observableFrom(result).pipe(
      catchError((err) => {
        // dialog dismissed, cancel -> undefined, backdrop -> 0, esc -> 1
        if (err === undefined || err === 0 || err === 1) {
          return EMPTY;
        }
        // real error
        throw err;
      }),
    );
  }

  // opens the modal that select() picks from the loaded chunk, sets the fields that init() assigns before the
  // first change detection as a plain modalService.open() would, and resolves to the modal ref
  private open<T>(
    select: (modals: Modals) => Type<T>,
    init: (modal: T) => void = () => {},
    options?: NgbModalOptions,
  ): Promise<NgbModalRef> {
    return this.modals.then((modals) => {
      const modalRef = this.modalService.open(select(modals), options);
      init(modalRef.componentInstance as T);
      return modalRef;
    });
  }

  // opens the modal and returns its result: resolved on close, rejected on dismiss. Like NgbModalRef.result it
  // has a rejection handler, so that a dismissed modal that no one listens to isn't an unhandled rejection
  private openResult<T>(select: (modals: Modals) => Type<T>, init?: (modal: T) => void, options?: NgbModalOptions) {
    const result = this.open(select, init, options).then((modalRef) => modalRef.result);
    result.then(null, () => {});
    return result;
  }

  // opens the modal and returns its result as an observable that completes without a value on dismiss
  private openObservable<T>(select: (modals: Modals) => Type<T>, init?: (modal: T) => void, options?: NgbModalOptions) {
    return DialogModalService.observableFromPromiseWithDismissHandling(this.openResult(select, init, options));
  }

  openSessionNameModal(title, name, buttonText = "Rename"): Observable<string> {
    return this.openStringModal(title, "Session name", name, buttonText);
  }

  openStringModal(title, description, value, buttonText) {
    return this.openObservable(
      (m) => m.StringModalComponent,
      (modal) => {
        modal.value = value;
        modal.title = title;
        modal.description = description;
        modal.buttonText = buttonText;
        modal.placeHolder = "";
      },
    );
  }

  openOptionModal(title, description, options, buttonText, placeholder) {
    return this.openObservable(
      (m) => m.DropdownModalComponent,
      (modal) => {
        modal.options = options;
        modal.title = title;
        modal.description = description;
        modal.buttonText = buttonText;
        modal.placeHolder = placeholder;
      },
    );
  }

  openNotificationModal(title, message) {
    return this.openObservable(
      (m) => m.NotificationModalComponent,
      (modal) => {
        modal.title = title;
        modal.message = message;
      },
    );
  }

  openNewsModal(news: NewsItem[]) {
    return this.openObservable(
      (m) => m.NewsModalComponent,
      (modal) => {
        modal.news = news;
      },
      { size: "lg" },
    );
  }

  openEditNewsModal(newsItem: NewsItem = null) {
    return this.openObservable(
      (m) => m.EditNewsModalComponent,
      (modal) => {
        modal.newsItem = newsItem;
      },
      { size: "lg" },
    );
  }

  downloadFromUrlModal() {
    return this.openObservable((m) => m.DownloadFromUrlModalComponent);
  }

  openPreModal(title, text) {
    return this.openObservable(
      (m) => m.PreModalComponent,
      (modal) => {
        modal.text = text;
        modal.title = title;
      },
      { size: "lg" },
    );
  }

  openTempCopyModal(title, message, value, button1Text, button2Text) {
    // no dismiss handling: the caller gets the dismissal as an error
    return observableFrom(
      this.openResult(
        (m) => m.TempCopyModalComponent,
        (modal) => {
          modal.value = value;
          modal.title = title;
          modal.message = message;
          modal.description = "New session name";
          modal.button1Text = button1Text;
          modal.button2Text = button2Text;
          modal.placeHolder = "";
        },
      ),
    );
  }

  openChoiceModal(
    title,
    message,
    question,
    action1: { text: string; disabled?: boolean },
    action2: { text: string; disabled?: boolean },
    cancelButtonText: string,
    action3?: { text: string; disabled?: boolean },
  ) {
    return this.openResult(
      (m) => m.ChoiceModalComponent,
      (modal) => {
        modal.title = title;
        modal.message = message;
        modal.question = question;
        modal.action1ButtonText = action1.text;
        modal.action1Disabled = action1.disabled ?? false;
        modal.action2ButtonText = action2.text;
        modal.action2Disabled = action2.disabled ?? false;
        modal.cancelButtonText = cancelButtonText;
        if (action3) {
          modal.action3ButtonText = action3.text;
          modal.action3Disabled = action3.disabled ?? false;
        }
      },
      { size: "lg" },
    );
  }

  openBooleanModal(
    title,
    message,
    okButtonText,
    cancelButtonText,
    okButtonClass = "btn-info",
    subMessage: string = null,
  ) {
    return this.openResult(
      (m) => m.BooleanModalComponent,
      (modal) => {
        modal.title = title;
        modal.message = message;
        modal.subMessage = subMessage;
        modal.okButtonText = okButtonText;
        modal.okButtonClass = okButtonClass;
        modal.cancelButtonText = cancelButtonText;
      },
    );
  }

  openDeleteFilesModal(datasets: Dataset[]) {
    return this.openResult(
      (m) => m.DeleteFilesModalComponent,
      (modal) => {
        modal.datasets = datasets;
      },
      { size: "md" },
    );
  }

  openNotesModal(session): Observable<string> {
    return this.openObservable(
      (m) => m.NotesModalComponent,
      (modal) => {
        modal.session = session;
      },
    );
  }

  openSharingModal(session, ruleStream$: Observable<SessionEvent>): Observable<any> {
    return this.openObservable(
      (m) => m.SharingModalComponent,
      (modal) => {
        modal.session = session;
        modal.ruleStream$ = ruleStream$;
      },
      { size: "lg" },
    );
  }

  public openJobsModal(jobs: Job[], tools: Tool[], sessionData: SessionData): Promise<NgbModalRef> {
    return this.open(
      (m) => m.JobsModalComponent,
      (modal) => {
        modal.jobs = jobs;
        modal.tools = tools;
        modal.sessionData = sessionData;
      },
      { size: "xl" },
    );
  }

  openSpinnerModal(message, observable) {
    return this.openObservable(
      (m) => m.SpinnerModalComponent,
      (modal) => {
        modal.message = message;
        modal.observable = observable;
      },
      // don't allow user to close this
      { backdrop: "static", keyboard: false },
    );
  }
}
