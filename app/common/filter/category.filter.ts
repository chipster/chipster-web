angular.module('chipster-web').filter('categoryFilter', function($filter){

    return function(arr,searchTool){
        if(!searchTool)
            return arr;

        var result=[];

        angular.forEach(arr,function(category){
            var filteredTools = $filter('toolFilter')(category.tools, searchTool);

            if(filteredTools.length > 0){
                result.push(category);
            }
        });

        return result;
    }
});