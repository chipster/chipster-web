import {Injectable, OnDestroy} from "@angular/core";
import {Store} from "@ngrx/store";
import {ToolSelection} from "./tools/ToolSelection";
import InputBinding from "../../../model/session/inputbinding";
import {Observable, Subject} from "rxjs";
import ToolParameter from "../../../model/session/toolparameter";
import {ToolService} from "./tools/tool.service";
import Dataset from "../../../model/session/dataset";


@Injectable()
export class ToolSelectionService implements OnDestroy {

  inputsValid$: Observable<boolean>;
  parametersValid$: Observable<boolean>;
  runEnabled$: Observable<boolean>;

  private currentToolSelection: ToolSelection; // needed for parameter checking
  private parameterChecker$: Subject<boolean> = new Subject();

  private subscriptions: Array<any> = [];

  constructor(private store: Store<any>,
              private toolService: ToolService) {

    this.subscriptions.push(this.store.select('toolSelection').subscribe((toolSelection: ToolSelection) => {
      this.currentToolSelection = toolSelection;

      if (toolSelection) {

        // get bound datasets for populating (dataset dependent) parameters
        let boundDatasets = toolSelection.inputBindings.reduce((datasets: Array<Dataset>, inputBinding: InputBinding) => {
          return datasets.concat(inputBinding.datasets);
        }, []);

        toolSelection.tool.parameters.forEach((parameter: ToolParameter) => {
          this.populateParameterValues(parameter, boundDatasets);
          this.parametersChanged()
        })
      }
    }));

    this.inputsValid$ = this.store.select('toolSelection').map((toolSelection: ToolSelection) => {

      if (!toolSelection || toolSelection.tool.inputs.length < 1) {
        return true;
      }
      return toolSelection.inputBindings.every((binding: InputBinding) => {
        return binding.toolInput.optional || binding.datasets.length > 0;
      });
    }).distinctUntilChanged();

    this.parametersValid$ = this.parameterChecker$.asObservable().distinctUntilChanged().startWith(true);

    this.runEnabled$ = Observable.combineLatest(this.store.select('toolSelection'), this.inputsValid$, this.parametersValid$,
      (toolSelection: ToolSelection, inputsValid, parametersValid) => {
        return toolSelection && inputsValid && parametersValid;
      }).distinctUntilChanged();
  }

  parametersChanged() {
    this.parameterChecker$.next(this.checkCurrentToolParameters());
  }

  checkCurrentToolParameters() : boolean {
    if (!this.currentToolSelection || !this.currentToolSelection.tool.parameters ||
      this.currentToolSelection.tool.parameters.length < 1) {
      return true;
    } else {
      return this.currentToolSelection.tool.parameters.every((parameter: ToolParameter) => {
        return parameter.optional ||
            parameter.value && parameter.value !== "";
      });
    }
  }

  populateParameterValues(parameter: ToolParameter, datasets: Array<Dataset>) {
    if (!parameter.value) {
      parameter.value = this.toolService.getDefaultValue(parameter);
    }

    if (datasets && datasets.length > 0 && parameter.type === 'COLUMN_SEL') {
      Observable.forkJoin(this.toolService.getDatasetHeaders(datasets)).subscribe((datasetsHeaders: Array<Array<string>>) => {
        let columns = _.uniq(_.flatten(datasetsHeaders));
        parameter.selectionOptions = columns.map(function (column) {
          return {id: column};
        });

        // reset value to empty if previous or default value is now invalid
        if (parameter.value && !this.toolService.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
          parameter.value = null;
        }
      });
    }

    if (datasets && datasets.length > 0 && parameter.type === 'METACOLUMN_SEL') {
      parameter.selectionOptions = this.toolService.getMetadataColumns(datasets).map(function (column) {
        return {id: column};
      });

      // reset value to empty if previous or default value is now invalid
      if (parameter.value && !this.toolService.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
        parameter.value = null;
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subs) => subs.unsubscribe());
    this.subscriptions = [];
  }


}
