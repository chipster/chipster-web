import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, inject } from "@angular/core";
import { LoadState } from "../../../model/loadstate";
import { NewsItem } from "../../../shared/components/news/NewsItem";
import { NewsService } from "../../../shared/services/news.service";
import { NewsListComponent } from "../../../shared/components/news/news-list.component";
import { StatusComponent } from "../../../shared/components/status.component";

@Component({
  selector: "ch-notifications",
  templateUrl: "./news.component.html",
  styleUrls: ["./news.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NewsListComponent, StatusComponent],
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);

  public news: NewsItem[];
  public state: LoadState;

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
