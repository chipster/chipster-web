export default class VolcanoPlotDataRow {

  id: string;
  values: Array<number>;

  constructor(id: string, values: Array<number>) {
    this.id = id;
    this.values = values;
  }

}
