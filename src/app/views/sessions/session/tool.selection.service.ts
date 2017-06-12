import {Injectable} from "@angular/core";
import {Store} from "@ngrx/store";
import {ToolSelection} from "./tools/ToolSelection";
import InputBinding from "../../../model/session/inputbinding";
import {Observable} from "rxjs";

@Injectable()
export class ToolSelectionService {

  inputsValid$: Observable<boolean>;
  //parametersValid$: Observable<boolean>;
  runEnabled$: Observable<boolean>;

  constructor(private store: Store<any>) {

    this.inputsValid$ = this.store.select('toolSelection').map((toolSelection: ToolSelection) => {
      if (!toolSelection || toolSelection.tool.inputs.length < 1) {
        return true;
      }
      return toolSelection.inputBindings.every((binding: InputBinding) => {
        return binding.toolInput.optional || binding.datasets.length > 0;
      });
    });

    this.runEnabled$ = Observable.combineLatest(this.store.select('toolSelection'), this.inputsValid$,
      (toolSelection: ToolSelection, inputsValid) => {
        return toolSelection && inputsValid;
      });
  }

}
