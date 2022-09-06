import { Component, Input, OnInit } from "@angular/core";
import log from "loglevel";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState } from "../../../model/loadstate";
import { NewsService } from "../../services/news.service";
import { NewsItem } from "./NewsItem";

@Component({
  selector: "ch-news-list",
  templateUrl: "./news-list.component.html",
})
export class NewsListComponent implements OnInit {
  // @Input() news: NewsItem[];
  @Input() editable = false;
  public news: NewsItem[];
  public state: LoadState;
  public errorMessage: string = "";

  constructor(private newsService: NewsService, private restErrorService: RestErrorService) {}

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
        this.errorMessage =
          error.status === 401 || error.status === 403
            ? "For now, you need to log in to see the news."
            : "Getting news failed.";
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
        this.restErrorService.showErrorAdmin("Add news failed.", error);
      },
      complete: () => this.getNews(),
    });
  }

  public onEdit(newsItem: NewsItem) {
    if (!this.editable) {
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
    if (!this.editable) {
      return;
    }

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
  }
}
