import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NewsItem } from "./NewsItem";

@Component({
  selector: "ch-news-item",
  templateUrl: "./news-item.component.html",
})
export class NewsItemComponent {
  @Input() newsItem: NewsItem;
  @Input() editable = false;
  @Output() edit = new EventEmitter<NewsItem>();
  @Output() delete = new EventEmitter<NewsItem>();

  public onEdit(newsItem: NewsItem) {
    this.edit.emit(newsItem);
  }

  public onDelete(newsItem: NewsItem) {
    this.delete.emit(newsItem);
  }
}
