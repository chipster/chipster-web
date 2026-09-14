import Circle from "../model/circle";

export default class VennCircle {
  constructor(
    public datasetId: string,
    public filename: string,
    // array of tuples containing symbol and identifier (both of which are nullable)
    public data: Array<Array<string>>,
    public circle: Circle,
  ) {}
}
