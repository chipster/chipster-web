import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Tool } from "chipster-js-common";
import { ToolResource } from "../resources/toolresource";
import { shareReplay } from "rxjs/operators";

@Injectable()
export class ToolsService {
  private toolsCache$: Observable<Tool[]>;

  constructor(private toolResource: ToolResource) {}

  getTools(): Observable<Tool[]> {
    if (!this.toolsCache$) {
      this.toolsCache$ = this.toolResource.getTools().pipe(shareReplay(1));
    }
    return this.toolsCache$;
  }
}
