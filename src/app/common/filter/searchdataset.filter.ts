import Dataset from "../../model/session/dataset";

/**
 * Filter for searching dataset in dataset list view
 */
export default function () {
    return function (array: Dataset[], expression: string) {

        var result: Dataset[] = [];

        if (!expression) {
            result = array;

        } else {
            array.forEach((item) => {

                if (item.name.toLowerCase().indexOf(expression.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
        }

        return result;
    }
};
