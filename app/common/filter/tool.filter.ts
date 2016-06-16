
angular.module('chipster-web').filter('toolFilter',function(){

    return function(arr,searchTool){
        if(!searchTool)
            return arr;

        var result=[];
        angular.forEach(arr,function(item){
            if(item.name.toLowerCase().indexOf(searchTool.toLowerCase())!==-1){
                result.push(item);
            }
        });

        return result;
    }

});