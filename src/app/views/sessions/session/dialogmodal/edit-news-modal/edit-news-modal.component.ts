import { Component, Input, OnInit } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NewsItem } from "../../../../../shared/components/news/NewsItem";

@Component({
  templateUrl: "./edit-news-modal.component.html",
})
export class EditNewsModalComponent implements OnInit {
  public modalTitle: string;
  @Input()
  newsItem: NewsItem;

  titleControl = new UntypedFormControl("");
  shortTitleControl = new UntypedFormControl("");
  bodyControl = new UntypedFormControl("");
  id: string;
  created: Date;
  modified: Date;

  form = new UntypedFormGroup({
    title: this.titleControl,
    shortTitle: this.shortTitleControl,
    body: this.bodyControl,
  });

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.newsItem == null) {
      this.modalTitle = "Add news";
    } else {
      this.titleControl.setValue(this.newsItem.contents.title);
      this.bodyControl.setValue(this.newsItem.contents.body);
      this.modalTitle = "Edit news";
      this.id = this.newsItem.newsId;
      this.created = this.newsItem.created;
      this.modified = this.newsItem.modified;
    }
  }

  public onSubmit(): void {
    this.activeModal.close({
      newsId: this.id,
      created: this.created,
      modified: this.modified,
      contents: {
        title: this.titleControl.value,
        shortTitle: this.shortTitleControl.value,
        body: this.bodyControl.value,
      },
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
