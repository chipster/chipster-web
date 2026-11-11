import { Component, input, output } from "@angular/core";
import { NewsItem } from "./NewsItem";
import { LocalDatePipe } from "../../pipes/local-date.pipe";

@Component({
  selector: "ch-news-item",
  templateUrl: "./news-item.component.html",
  imports: [LocalDatePipe],
})
export class NewsItemComponent {
  readonly newsItem = input<NewsItem>(undefined);
  readonly editable = input(false);
  readonly edit = output<NewsItem>();
  readonly delete = output<NewsItem>();

  public onEdit(newsItem: NewsItem) {
    this.edit.emit(newsItem);
  }

  public onDelete(newsItem: NewsItem) {
    this.delete.emit(newsItem);
  }
}
