import { Injectable } from "@angular/core";
import {
  SelectedToolWithInputs,
  SelectedToolWithValidatedInputs,
  ParameterValidationResult
} from "./tools/ToolSelection";
import {
  InputBinding,
  ToolParameter,
  Dataset,
  ToolInput
} from "chipster-js-common";
import { Observable } from "rxjs";
import { ToolService } from "./tools/tool.service";
import * as _ from "lodash";
import { forkJoin, of } from "rxjs";
import { SessionData } from "../../../model/session/session-data";
import { DatasetService } from "./dataset.service";
import log from "loglevel";


@Injectable()
export class ToolSelectionService {
  constructor(
    private toolService: ToolService,
    private datasetService: DatasetService
  ) {}

  validateParameters(
    selectedToolWithValidatedInputs: SelectedToolWithValidatedInputs
  ) {
    const resultsMap = new Map<string, ParameterValidationResult>();
    if (
      selectedToolWithValidatedInputs &&
      selectedToolWithValidatedInputs.tool &&
      selectedToolWithValidatedInputs.tool.parameters &&
      selectedToolWithValidatedInputs.tool.parameters.length > 0
    ) {
      selectedToolWithValidatedInputs.tool.parameters.forEach(
        (parameter: ToolParameter) => {
          resultsMap.set(parameter.name.id, this.validateParameter(parameter));
        }
      );
    }
    return resultsMap;
  }

  validateParameter(parameter: ToolParameter): ParameterValidationResult {
    // required parameter must not be emtpy
    if (!parameter.optional && !this.parameterHasValue(parameter)) {
      return { valid: false, message: "Required parameter can not be empty" };
    }

    // numbers
    if (
      this.parameterHasValue(parameter) &&
      this.toolService.isNumberParameter(parameter)
    ) {
      // integer must be integer
      if (
        parameter.type === "INTEGER" &&
        !Number.isInteger(<number>parameter.value)
      ) {
        return {
          valid: false,
          message: "Value must be an integer"
        };
      }
      // min limit
      if (parameter.from && parameter.value < parameter.from) {
        return {
          valid: false,
          message: "Value must be greater than or equal to " + parameter.from
        };
      }

      // max limit
      if (parameter.to && parameter.value > parameter.to) {
        return {
          valid: false,
          message: "Value must be less than or equal to " + parameter.to
        };
      }
    } else if (
      this.parameterHasValue(parameter) &&
      parameter.type === "STRING"
    ) {
      // this regex should be same as that on the server side
      // uglifyjs fails if using literal reg exp
      // unlike with the java version on the server side
      // '-' doesn't seem to work in the middle, escaped or not, --> it's now last
      
      // firefox doesn't support unicode property escapes yet so catch
      // the error, server side will validate it anyway and fail the job
      // const regexp: RegExp = new RegExp("[^\\p{L}\\p{N}+_:.,*() -]", "u");
      let result;
      try {
        const regexp: RegExp = new RegExp("[^\\p{L}\\p{N}+_:.,*() -]", "u");
        result = regexp.exec(<string>parameter.value);
      } catch (e) {
        log.warn("validating string parameter failed");
        return {
          valid: true
        };
      }
      return result === null
        ? { valid: true }
        : {
            valid: false,
            message: "Illegal character '" + result[0] + "'"
          };
    }

    return { valid: true };
  }

  parameterHasValue(parameter: ToolParameter) {
    return (
      parameter.value !== null &&
      typeof parameter !== "undefined" &&
      String(parameter.value).trim() !== ""
    );
  }

  populateParameters(
    selectedToolWithInputs: SelectedToolWithValidatedInputs
  ): Observable<SelectedToolWithValidatedInputs> {
    if (selectedToolWithInputs.tool) {
      // get bound datasets for populating (dataset dependent) parameters
      const boundDatasets = selectedToolWithInputs.inputBindings.reduce(
        (datasets: Array<Dataset>, inputBinding: InputBinding) => {
          return datasets.concat(inputBinding.datasets);
        },
        []
      );

      // populating params is async as some selection options may require dataset contents
      const populateParameterObservables = selectedToolWithInputs.tool.parameters.map(
        (parameter: ToolParameter) => {
          return this.populateParameter(parameter, boundDatasets);
        }
      );
      return forkJoin(populateParameterObservables).map(() => {
        return selectedToolWithInputs;
      });
    }
    return of(selectedToolWithInputs);
  }

  /**
   * Always return an observable, which emits at least one value and then completes.
   * This is needed because we use forkJoin for combining parameter populating and
   * forkJoin completes immediately if one of the observables complete without
   * emitting anything. Also if one of the observables doesn't complete, forkJoin
   * won't complete.
   */
  populateParameter(
    parameter: ToolParameter,
    datasets: Array<Dataset>
  ): Observable<ToolParameter> {
    // for other than column selection parameters, set to default if no value
    if (
      !this.toolService.isColumnSelectionParameter(parameter) &&
      !parameter.value
    ) {
      parameter.value = this.toolService.getDefaultValue(parameter);
      return of(parameter);
    }

    // column selection parameters
    if (this.toolService.isColumnSelectionParameter(parameter)) {
      // no datasets --> set to null
      if (datasets && datasets.length < 1) {
        parameter.selectionOptions = [];
        parameter.value = null;
        return of(parameter);
      }

      // COLUMN_SEL, getting headers is async
      if (parameter.type === "COLUMN_SEL") {
        // populate column_sel only for tsv files
        // FIXME should check type tag instead of name, atm would need sessionData for that
        if (!datasets[0].name.endsWith(".tsv")) {
          parameter.selectionOptions = [];
          parameter.value = null;
          return of(parameter);
        }

        return Observable.forkJoin(
          this.toolService.getDatasetHeaders(datasets)
        ).map((datasetsHeaders: Array<Array<string>>) => {
          const columns = _.uniq(_.flatten(datasetsHeaders));

          parameter.selectionOptions = columns.map(function(column) {
            return { id: column };
          });
          this.setColumnSelectionParameterValueAfterPopulate(parameter);
          return parameter;
        });
      } else if (parameter.type === "METACOLUMN_SEL") {
        // METACOLUMN_SEL
        parameter.selectionOptions = this.toolService
          .getMetadataColumns(datasets)
          .map(function(column) {
            return { id: column };
          });

        this.setColumnSelectionParameterValueAfterPopulate(parameter);
        return of(parameter);
      }
    }

    return of(parameter); // always return, even if nothing gets done
  }

  validateInputs(toolWithInputs: SelectedToolWithInputs): boolean {
    if (!toolWithInputs.tool || toolWithInputs.tool.inputs.length < 1) {
      return true;
    } else {
      // phenodata inputs are not included in the bindings, so no need to deal with them
      return toolWithInputs.inputBindings.every((binding: InputBinding) => {
        return binding.toolInput.optional || binding.datasets.length > 0;
      });
    }
  }

  validatePhenodata(toolWithInputs: SelectedToolWithInputs): boolean {
    if (!toolWithInputs.tool || toolWithInputs.tool.inputs.length < 1) {
      return true;
    }

    // if no pheondata inputs, return true;
    if (!toolWithInputs.tool.inputs.some((input: ToolInput) => input.meta)) {
      return true;
    }

    // for now, the first bound dataset must have some metadata
    return (
      toolWithInputs.inputBindings[0].datasets.length > 0 &&
      this.datasetService.hasPhenodata(
        toolWithInputs.inputBindings[0].datasets[0]
      )
    );

    // // get group 'column' values
    // const groupEntries: Array<
    //   MetadataEntry
    // > = toolWithInputs.inputBindings[0].datasets[0].metadata.filter(
    //   (entry: MetadataEntry) => entry.key === "group"
    // );

    // // check if group 'column' exists and that every row has value for it
    // if (groupEntries.length < 1) {
    //   return false;
    // } else {
    //   return groupEntries.every(
    //     (entry: MetadataEntry) =>
    //       entry.value != null && entry.value.trim().length > 0
    //   );
    // }
  }

  validateRunForEach(
    toolWithInputs: SelectedToolWithInputs,
    sessionData: SessionData
  ): boolean {
    return (
      toolWithInputs.tool &&
      toolWithInputs.tool.inputs.length === 1 &&
      !this.toolService.isMultiInput(toolWithInputs.tool.inputs[0]) &&
      toolWithInputs.selectedDatasets &&
      toolWithInputs.selectedDatasets.length > 1 &&
      toolWithInputs.selectedDatasets.every((dataset: Dataset) =>
        this.toolService.isCompatible(
          sessionData,
          dataset,
          toolWithInputs.tool.inputs[0].type.name
        )
      )
    );
  }

  getValidationMessage(
    parametersValid: boolean,
    inputsValid: boolean,
    phenodataValid: boolean
  ): string {
    if (!parametersValid && !inputsValid) {
      return "Invalid parameters and missing input files";
    } else if (!parametersValid && !phenodataValid) {
      return "Invalid parameters and missing phenodata";
    } else if (!parametersValid) {
      return "Invalid parameters";
    } else if (!inputsValid) {
      return "Missing input files";
    } else if (!phenodataValid) {
      return "Missing phenodata";
    } else {
      return "";
    }
  }

  private setColumnSelectionParameterValueAfterPopulate(
    parameter: ToolParameter
  ) {
    // set value to null if previous not an option
    if (
      parameter.value != null &&
      !this.toolService.selectionOptionsContains(
        parameter.selectionOptions,
        parameter.value
      )
    ) {
      parameter.value = null;
    }

    // set to default if null and default an option
    // could be null because it was already null, or it was reset above because previous not an option
    if (parameter.value == null) {
      const defaultValue = this.toolService.getDefaultValue(parameter);
      if (
        this.toolService.selectionOptionsContains(
          parameter.selectionOptions,
          defaultValue
        )
      ) {
        parameter.value = defaultValue;
      }
    }
  }
}
