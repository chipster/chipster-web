import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, input } from "@angular/core";
import { NewsItem } from "./NewsItem";
import { LocalDatePipe } from "../../pipes/local-date.pipe";

@Component({
  selector: "ch-news-item",
  templateUrl: "./news-item.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LocalDatePipe],
})
export class NewsItemComponent {
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() newsItem: NewsItem;
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
