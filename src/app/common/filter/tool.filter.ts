
import Tool from "../../model/session/tool";
export default function(){

    return function(arr: Tool[], searchTool: string){
        if(!searchTool)
            return arr;

        var result: Tool[] = [];
        arr.forEach((item: Tool) => {
            if(item.name.displayName.toLowerCase().indexOf(searchTool.toLowerCase())!==-1){
                result.push(item);
            }
        });

        return result;
    }

};