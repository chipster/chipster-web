import { Component, OnInit, ViewEncapsulation, inject, signal } from "@angular/core";
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
  imports: [NewsListComponent, StatusComponent],
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);

  readonly news = signal<NewsItem[]>(undefined);
  readonly state = signal<LoadState>(undefined);

  ngOnInit(): void {
    this.state.set(LoadState.Loading);
    this.newsService.getAllNews().subscribe({
      next: (newNews: NewsItem[]) => {
        this.news.set(newNews);
        this.state.set(LoadState.Ready);
      },
    });
  }
}
