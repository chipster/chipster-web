import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { NewsItem } from "../../../../../shared/components/news/NewsItem";
import { PreferencesService } from "../../../../../shared/services/preferences.service";

@Component({
  templateUrl: "./news-modal.component.html",
})
export class NewsModalComponent implements OnInit {
  @Input()
  news: NewsItem[];

  constructor(private activeModal: NgbActiveModal, private preferencesService: PreferencesService) {}
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
