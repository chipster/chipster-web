import * as _ from "lodash";
import GeneExpression from "../../views/sessions/session/visualization/expressionprofile/geneexpression";

export default class TSVRow {

    id: string;
    row: Array<string>;

    constructor(row: Array<string>, id: string) {
        this.id = id;
        this.row = row;
    }

    size(): number {
        return this.row.length;
    }

    /*
     * Return GeneExpression based on id for the TSVRow and the values in indexes of row
     */
    getGeneExpressionsByIndex(indexes: Array<number>): GeneExpression {
        let values = _.map( indexes, index => this.parseToNumber(this.row[index]) );
        return new GeneExpression(this.id, values);
    }

    parseToNumber(value: string): number {
        return parseFloat(value);
    }


}