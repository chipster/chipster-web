import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, SessionEvent, Tool } from "chipster-js-common";
import { EMPTY, Observable, from as observableFrom } from "rxjs";
import { catchError } from "rxjs/operators";
import { SessionData } from "../../../../model/session/session-data";
import { NewsItem } from "../../../../shared/components/news/NewsItem";
import { JobsModalComponent } from "../jobs-modal/jobs-modal.component";
import { BooleanModalComponent } from "./booleanmodal/booleanmodal.component";
import { DeleteFilesModalComponent } from "./delete-files-modal/delete-files-modal.component";
import { DownloadFromUrlModalComponent } from "./download-from-url-modal/download-from-url.component";
import { EditNewsModalComponent } from "./edit-news-modal/edit-news-modal.component";
import { NewsModalComponent } from "./news-modal/news-modal.component";
import { NotesModalComponent } from "./notes-modal/notes-modal.component";
import { NotificationModalComponent } from "./notification-modal/notification-modal.component";
import { PreModalComponent } from "./pre-modal/pre-modal.component";
import { SharingModalComponent } from "./share-session-modal/share-session-modal.component";
import { SpinnerModalComponent } from "./spinnermodal/spinnermodal.component";
import { StringModalComponent } from "./stringmodal/stringmodal.component";
import { TempCopyModalComponent } from "./temp-copy-modal/temp-copy-modal.component";
import { DropdownModalComponent } from "./dropdownmodal/dropdown-modal.component";

@Injectable()
export class DialogModalService {
  constructor(private modalService: NgbModal) {}

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

  openSessionNameModal(title, name, buttonText = "Rename"): Observable<string> {
    return this.openStringModal(title, "Session name", name, buttonText);
  }

  openStringModal(title, description, value, buttonText) {
    const modalRef = this.modalService.open(StringModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;
    modalRef.componentInstance.placeHolder = "";
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openOptionModal(title, description, options, buttonText, placeholder) {
    const modalRef = this.modalService.open(DropdownModalComponent);
    modalRef.componentInstance.options = options;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;
    modalRef.componentInstance.placeHolder = placeholder;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openNotificationModal(title, message) {
    const modalRef = this.modalService.open(NotificationModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openNewsModal(news: NewsItem[]) {
    const modalRef = this.modalService.open(NewsModalComponent, {
      size: "lg",
    });
    modalRef.componentInstance.news = news;

    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openEditNewsModal(newsItem: NewsItem = null) {
    const modalRef = this.modalService.open(EditNewsModalComponent, {
      size: "lg",
    });
    modalRef.componentInstance.newsItem = newsItem;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  downloadFromUrlModal() {
    const modalRef = this.modalService.open(DownloadFromUrlModalComponent);
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openPreModal(title, text) {
    const modalRef = this.modalService.open(PreModalComponent, {
      size: "lg",
    });
    modalRef.componentInstance.text = text;
    modalRef.componentInstance.title = title;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openTempCopyModal(title, message, value, button1Text, button2Text) {
    const modalRef = this.modalService.open(TempCopyModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.description = "New session name";
    modalRef.componentInstance.button1Text = button1Text;
    modalRef.componentInstance.button2Text = button2Text;
    modalRef.componentInstance.placeHolder = "";

    return observableFrom(modalRef.result);
  }

  openBooleanModal(title, message, okButtonText, cancelButtonText) {
    const modalRef = this.modalService.open(BooleanModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.okButtonText = okButtonText;
    modalRef.componentInstance.cancelButtonText = cancelButtonText;

    return modalRef.result;
  }

  openDeleteFilesModal(datasets: Dataset[]) {
    const modalRef = this.modalService.open(DeleteFilesModalComponent, { size: "md" });
    modalRef.componentInstance.datasets = datasets;

    return modalRef.result;
  }

  openNotesModal(session): Observable<string> {
    const modalRef = this.modalService.open(NotesModalComponent);
    modalRef.componentInstance.session = session;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openSharingModal(session, ruleStream$: Observable<SessionEvent>): Observable<any> {
    const modalRef = this.modalService.open(SharingModalComponent, {
      size: "lg",
    });
    modalRef.componentInstance.session = session;
    modalRef.componentInstance.ruleStream$ = ruleStream$;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  public openJobsModal(jobs: Job[], tools: Tool[], sessionData: SessionData) {
    const modalRef = this.modalService.open(JobsModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.jobs = jobs;
    modalRef.componentInstance.tools = tools;
    modalRef.componentInstance.sessionData = sessionData;

    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }

  openSpinnerModal(message, observable) {
    // don't allow user to close this
    const modalRef = this.modalService.open(SpinnerModalComponent, {
      backdrop: "static",
      keyboard: false,
    });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.observable = observable;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }
}
