import { Component, Input, OnInit, ChangeDetectionStrategy, forwardRef } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { NewsItem } from "../../../../../shared/components/news/NewsItem";
import { PreferencesService } from "../../../../../shared/services/preferences.service";
import { NewsListComponent } from "../../../../../shared/components/news/news-list.component";

@Component({
  templateUrl: "./news-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  // forwardRef for every import in an import cycle with this component (the modal
  // services import the modals to open them): which of them is still undefined when
  // this decorator runs depends on the bundler, so all of them get it (NG0919)
  imports: [forwardRef(() => NewsListComponent)],
})
export class NewsModalComponent implements OnInit {
  @Input()
  news: NewsItem[];

  constructor(
    private activeModal: NgbActiveModal,
    private preferencesService: PreferencesService,
  ) {}
  ngOnInit(): void {
    // FIXME scroll ot the top (to the latest) if there are so many news that modal needs to scroll
    if (this.news != null && this.news.length > 0) {
      const latestNewsTime: Date = this.news[0].modified != null ? this.news[0].modified : this.news[0].created;

      log.info("news read until", latestNewsTime);
      this.preferencesService.updateNewsReadTime(latestNewsTime);
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
