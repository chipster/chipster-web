/**
 * Filter for searching dataset in dataset list view
 */
export default function ($rootScope) {
    return function (array, expression) {

        var result = [];

        if (!expression) {
            result = array;

        } else {
            angular.forEach(array, function (item) {

                if (item.name.toLowerCase().indexOf(expression.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
        }

        //Here I am braodcasting the filtered result with rootScope to send it to workflowgraph directive, but there might be
        //a better way to make this communication
        if (expression) {
            $rootScope.$broadcast('searchDatasets', {data: result});
        } else {
            $rootScope.$broadcast('searchDatasets', {data: null});
        }

        return result;
    }

};
