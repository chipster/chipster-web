
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Module, Tool } from "chipster-js-common";
import { Observable } from "rxjs";
import { mergeMap } from 'rxjs/operators';
import { ConfigService } from "../services/config.service";

@Injectable()
export class ToolResource {
  constructor(
    private configService: ConfigService,
    private http: HttpClient
  ) { }

  getModules(): Observable<Module[]> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.pipe(mergeMap((apiUrl: string) =>
      this.http.get<Module[]>(`${apiUrl}/modules`)
    ));
  }

  getTools(): Observable<Tool[]> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.pipe(mergeMap((apiUrl: string) =>
      this.http.get<Tool[]>(`${apiUrl}/tools`)
    ));
  }

  getSourceCode(toolId: string): Observable<string> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.pipe(mergeMap((apiUrl: string) =>
      this.http.get(`${apiUrl}/tools/${toolId}/source`, {
        responseType: "text"
      })
    ));
  }
}
