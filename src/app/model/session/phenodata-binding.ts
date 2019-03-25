import { Dataset, ToolInput } from "chipster-js-common";

export class PhenodataBinding {
  toolInput: ToolInput;
  dataset: Dataset; // needs to be changed when dataset can have multiple phenodatas
}
