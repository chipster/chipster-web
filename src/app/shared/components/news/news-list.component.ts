import { Component, OnInit, ChangeDetectionStrategy, inject, input } from "@angular/core";
import log from "loglevel";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState } from "../../../model/loadstate";
import { DialogModalService } from "../../../views/sessions/session/dialogmodal/dialogmodal.service";
import { NewsService } from "../../services/news.service";
import { NewsItem } from "./NewsItem";
import { NewsItemComponent } from "./news-item.component";

@Component({
  selector: "ch-news-list",
  templateUrl: "./news-list.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NewsItemComponent],
})
export class NewsListComponent implements OnInit {
  private newsService = inject(NewsService);
  private restErrorService = inject(RestErrorService);
  private dialogModalService = inject(DialogModalService);

  // @Input() news: NewsItem[];
  readonly editable = input(false);
  public news: NewsItem[];
  public state: LoadState;
  public errorMessage: string = "";

  ngOnInit(): void {
    this.getNews();
  }

  public getNews(): void {
    this.state = LoadState.Loading;
    this.newsService.getAllNews().subscribe({
      next: (newNews: NewsItem[]) => {
        this.news = newNews;
        this.state = LoadState.Ready;
      },
      error: (error) => {
        log.warn("get news failed", error);
        this.errorMessage = "Getting news failed.";
        this.state = LoadState.Fail;
      },
    });
  }

  public onAdd() {
    this.newsService.openModalAndUploadNews().subscribe({
      next: (result) => {
        log.info("add news done", result);
      },
      error: (error) => {
        log.warn("add news failed", error);
        this.restErrorService.showErrorAdmin("Adding news failed.", error);
      },
      complete: () => this.getNews(),
    });
  }

  public onEdit(newsItem: NewsItem) {
    if (!this.editable()) {
      return;
    }

    this.newsService.openModalAndUploadNews(newsItem).subscribe({
      next: (result) => log.info("edit news done", result),
      error: (error) => {
        log.warn("edit news failed", error);
        this.restErrorService.showErrorAdmin("Edit news failed.", error);
      },
      complete: () => {
        this.getNews();
      },
    });
  }

  public onDelete(news: NewsItem) {
    if (!this.editable()) {
      return;
    }

    this.dialogModalService
      .openBooleanModal("Delete news", `Delete news '${news.contents.title}'?`, "Delete", "Cancel", "btn-danger")
      .then(
        () => {
          this.newsService.deleteNewsItem(news).subscribe({
            next: () => {
              log.info("delete news done");
            },
            error: (error) => {
              log.warn("delete news failed", error);
              this.restErrorService.showErrorAdmin("Delete news failed.", error);
            },
            complete: () => this.getNews(),
          });
        },
        () => {
          // modal dismissed
        },
      );
  }
}
