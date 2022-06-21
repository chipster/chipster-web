import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { LoadState } from "../../../model/loadstate";
import { NewsItem } from "../../../shared/components/news/NewsItem";
import { NewsService } from "../../../shared/services/news.service";

@Component({
  selector: "ch-notifications",
  templateUrl: "./news.component.html",
  styleUrls: ["./news.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NewsComponent implements OnInit {
  public news: NewsItem[];
  public state: LoadState;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.state = LoadState.Loading;
    this.newsService.getAllNews().subscribe({
      next: (newNews: NewsItem[]) => {
        this.news = newNews;
        this.state = LoadState.Ready;
      },
    });
  }
}
