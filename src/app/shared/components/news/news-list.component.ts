import { Component, Input, OnInit } from "@angular/core";
import log from "loglevel";
import { LoadState } from "../../../model/loadstate";
import { NewsService } from "../../services/news.service";
import { NewsItem } from "./NewsItem";

@Component({
  selector: "ch-news-list",
  templateUrl: "./news-list.component.html",
})
export class NewsListComponent implements OnInit {
  @Input() editable = false;
  public news: NewsItem[];

  public state: LoadState;

  constructor(private newsService: NewsService) {}

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
    });
  }

  public onAdd() {
    this.newsService.openModalAndUploadNews().subscribe({
      next: (result) => {
        log.info("add news done", result);
      },
      error: (error) => log.warn("add news failed", error),
      complete: () => this.getNews(),
    });
  }

  public onEdit(newsItem: NewsItem) {
    if (!this.editable) {
      return;
    }

    this.newsService.openModalAndUploadNews(newsItem).subscribe({
      next: (result) => log.info("edit news done", result),
      error: (error) => log.warn("edit news failed", error),
      complete: () => this.getNews(),
    });
  }

  public onDelete(news: NewsItem) {
    if (!this.editable) {
      return;
    }

    this.newsService.deleteNewsItem(news).subscribe({
      next: (result) => {
        log.info("delete news done", result);
      },
      error: (error) => log.warn("add news failed", error),
      complete: () => this.getNews(),
    });
  }
}
