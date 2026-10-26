import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal, viewChild, ElementRef } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { SessionResource } from "../../../../../shared/resources/session.resource";
import { UploadService } from "../../../../../shared/services/upload.service";
import { NgbProgressbar } from "@ng-bootstrap/ng-bootstrap/progressbar";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { SecondsPipe } from "../../../../../shared/pipes/secondspipe.pipe";

@Component({
  selector: "ch-add-dataset-modal-content",
  templateUrl: "./upload-modal.component.html",
  styleUrls: ["./upload-modal.component.less"],
  imports: [NgbProgressbar, NGB_DROPDOWN_IMPORTS, BytesPipe, SecondsPipe],
})
export class UploadModalComponent implements AfterViewInit, OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  private uploadService = inject(UploadService);
  private sessionResource = inject(SessionResource);
  private errorService = inject(ErrorService);

  // set through the modal ref by the code that opens the modal
  readonly sessionId = signal<string>(undefined);
  readonly flow = signal<any>(undefined);

  readonly uploadFilesButton = viewChild<ElementRef<HTMLButtonElement>>("uploadFilesButton");
  readonly uploadFolderButton = viewChild<ElementRef<HTMLButtonElement>>("uploadFolderButton");

  /*
   * A snapshot of the files of flow.js, taken when it tells about a change. Flow.js changes the
   * progress of its files on every progress event of the requests, but tells about it at most every
   * 500 ms, so a view of the files themselves would change without a notification.
   */
  readonly files = signal<UploadRow[]>([]);
  readonly timeRemaining = signal(0);

  // function references needed for the flow.off in ngOnDestroy
  // 'this' used inside so need to use => or bind
  update = () => {
    this.files.set(
      this.flow()
        .files.slice()
        .reverse()
        .map((file) => ({
          file,
          relativePath: file.relativePath,
          size: file.size,
          progress: file.progress(),
          complete: file.isComplete(),
          error: file.error,
          paused: file.paused,
          currentSpeed: file.currentSpeed,
        })),
    );
    this.timeRemaining.set(this.flow().timeRemaining());
  };

  complete = () => {
    // this.activeModal.close();
  };

  ngOnInit() {
    this.flow().on("progress", this.update);
    this.flow().on("fileRemoved", this.update);
    this.flow().on("error", this.update);
    // a completed file doesn't get a progress event of its own after this
    this.flow().on("fileSuccess", this.update);
    this.flow().on("complete", this.complete);
  }

  ngOnDestroy() {
    this.flow().off("progress", this.update);
    this.flow().off("fileRemoved", this.update);
    this.flow().off("error", this.update);
    this.flow().off("fileSuccess", this.update);
    this.flow().off("complete", this.complete);
  }

  // called by upload.component
  fileAdded(file: any) {
    this.uploadService.startUpload(this.sessionId(), file, false);
    this.update();
  }

  // the buttons change the files of flow.js, which tells about it only with the next progress
  pause(file: any) {
    file.pause();
    this.update();
  }

  resume(file: any) {
    file.resume();
    this.update();
  }

  cancelAll() {
    this.flow().cancel();
    this.update();
  }

  resumeAll() {
    this.flow().resume();
    this.update();
  }

  pauseAll() {
    this.flow().pause();
    this.update();
  }

  ngAfterViewInit() {
    this.flow().assignBrowse(this.uploadFilesButton());
    this.flow().assignBrowse(this.uploadFolderButton(), true);
  }

  cancelUpload(file: any) {
    file.cancel();
    this.update();
    this.sessionResource.deleteDataset(file.chipsterSessionId, file.chipsterDatasetId).subscribe({
      error: (err) => {
        this.errorService.showError("cancel failed", err);
      },
    });
  }
}

interface UploadRow {
  // the file of flow.js, for the buttons
  file: any;
  relativePath: string;
  size: number;
  progress: number;
  complete: boolean;
  error: boolean;
  paused: boolean;
  currentSpeed: number;
}
