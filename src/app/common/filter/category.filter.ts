import Category from "../../model/session/category";

function categoryFilter($filter: any){

    return function(arr: Category[], searchTool: string){
        if(!searchTool)
            return arr;

        var result: Category[] = [];

        arr.forEach((category) => {
            var filteredTools = $filter('toolFilter')(category.tools, searchTool);

            if(filteredTools.length > 0){
                result.push(category);
            }
        });

        return result;
    }
};

export default categoryFilter;