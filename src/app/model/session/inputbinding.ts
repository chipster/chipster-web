import Dataset from "./dataset";
import ToolInput from "./toolinput";

export default class InputBinding {
  toolInput: ToolInput;
  datasets: Dataset[] = [];
}
