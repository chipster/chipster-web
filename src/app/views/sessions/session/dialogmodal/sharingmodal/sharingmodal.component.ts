import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router, UrlTree} from "@angular/router";
import {Store} from "@ngrx/store";
import Session from "../../../../../model/session/session";
import Dataset from "../../../../../model/session/dataset";
import * as copy from 'copy-to-clipboard';

@Component({
  templateUrl: './sharingmodal.component.html'
})
export class SharingModalComponent implements AfterViewInit{

  @Input() session: Session;

  @ViewChild('submitButton') submitButton;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<any>,
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    this.submitButton.nativeElement.focus();
  }

  save() {
    this.activeModal.close(this.session.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }

  saveCurrentUrlState() {
    // copy current route and selected datasetids as queryparameters to clippath
    this.store.select('selectedDatasets').subscribe( (datasets: Array<Dataset>) => {
      const datasetIds = datasets.map( (dataset: Dataset) => dataset.datasetId);
      const navigationExtras = { queryParams: { id: datasetIds } };
      const sessionId = this.route.snapshot.params['sessionId'];
      const urlTree: UrlTree = this.router.createUrlTree( ['sessions', sessionId], navigationExtras );
      if(datasetIds.length > 0) {
        copy(`${window.location.host}${urlTree.toString()}`);
      }
    }).unsubscribe();
  }
}
