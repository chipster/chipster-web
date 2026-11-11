import { Injectable, Pipe, PipeTransform, inject } from "@angular/core";
import { Tool } from "chipster-js-common";
import { PipeService } from "../services/pipeservice.service";

// injected as a service too
@Injectable({ providedIn: "root" })
@Pipe({ name: "toolpipe" })
export class ToolPipe implements PipeTransform {
  private pipeService = inject(PipeService);

  transform(arr: Tool[], searchTool: string): any {
    return this.pipeService.findTools(arr, searchTool);
  }
}
