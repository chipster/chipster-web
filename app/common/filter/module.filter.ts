
angular.module('chipster-web').filter('moduleFilter', function($filter){

    return function(arr,searchTool){
        if(!searchTool)
            return arr;

        var result=[];

        angular.forEach(arr,function(module){
            var filteredTools = $filter('categoryFilter')(module.categories, searchTool);

            if(filteredTools.length > 0){
                result.push(module);
            }
        });

        return result;
    }
});