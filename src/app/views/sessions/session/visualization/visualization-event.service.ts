import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject } from "rxjs";
import { SelectionService } from "../selection.service";

@Injectable({ providedIn: "root" })
export class VisualizationEventService {
  private openPhenodataSubject = new ReplaySubject<boolean>(1);

  constructor() {
    const selectionService = inject(SelectionService);

    selectionService.selectedDatasets$.subscribe(() => {
      this.phenodataSelected(false);
    });
  }

  phenodataSelected(phenodataSelected: boolean) {
    this.openPhenodataSubject.next(phenodataSelected);
  }

  getPhenodataSelectedStream(): Observable<boolean> {
    return this.openPhenodataSubject.asObservable();
  }
}
