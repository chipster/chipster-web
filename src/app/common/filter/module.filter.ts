import Module from "../../model/session/module";

export default function($filter: any){

    return function(arr: Module[], searchTool: string){
        if(!searchTool)
            return arr;

        var result: Module[] = [];

        arr.forEach((module) => {
            var filteredTools = $filter('categoryFilter')(module.categories, searchTool);

            if(filteredTools.length > 0){
                result.push(module);
            }
        });

        return result;
    }
};