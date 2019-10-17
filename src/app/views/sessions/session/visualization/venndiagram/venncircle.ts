import Circle from "../model/circle";
export default class VennCircle {
  constructor(
    public datasetId: string,
    public filename: string,
    public data: Array<Array<string>>,
    public circle: Circle
  ) {
    datasetId;
    filename;
    data; // array of tuples containing symbol and identifier (both of which are nullable)
    circle;
  }
}
