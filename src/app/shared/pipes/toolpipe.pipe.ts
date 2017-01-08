import {Pipe, PipeTransform} from '@angular/core';
import Tool from "../../model/session/tool";
import {PipeService} from "./pipeservice.service";

@Pipe({
  name: 'toolpipe'
})
export class ToolpipePipe implements PipeTransform {

  constructor(private pipeService: PipeService){}

  transform(arr: Tool[], searchTool: string): any {
    return this.pipeService.findTools(arr, searchTool);
  }

}
