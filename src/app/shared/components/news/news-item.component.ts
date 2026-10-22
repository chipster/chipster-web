import { Component, EventEmitter, Output, ChangeDetectionStrategy, input } from "@angular/core";
import { NewsItem } from "./NewsItem";
import { LocalDatePipe } from "../../pipes/local-date.pipe";

@Component({
  selector: "ch-news-item",
  templateUrl: "./news-item.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LocalDatePipe],
})
export class NewsItemComponent {
  readonly newsItem = input<NewsItem>(undefined);
  readonly editable = input(false);
  @Output() edit = new EventEmitter<NewsItem>();
  @Output() delete = new EventEmitter<NewsItem>();

  public onEdit(newsItem: NewsItem) {
    this.edit.emit(newsItem);
  }

  public onDelete(newsItem: NewsItem) {
    this.delete.emit(newsItem);
  }
}
