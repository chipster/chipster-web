import { ConfigService } from "../services/config.service";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { RestService } from "../../core/rest-services/restservice/rest.service";
import { ResponseContentType } from "@angular/http";
import { Tool } from "chipster-js-common";

@Injectable()
export class ToolResource {
  constructor(
    private configService: ConfigService,
    private restService: RestService
  ) {}

  getModules(): Observable<any> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.flatMap((apiUrl: string) =>
      this.restService.get(`${apiUrl}/modules`)
    );
  }

  getTools(): Observable<Tool[]> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.flatMap((apiUrl: string) =>
      this.restService.get(`${apiUrl}/tools`)
    );
  }

  getSourceCode(toolId: string): Observable<string> {
    const apiUrl$ = this.configService.getToolboxUrl();
    return apiUrl$.flatMap((apiUrl: string) =>
      this.restService.get(`${apiUrl}/tools/${toolId}/source`, false, {
        responseType: ResponseContentType.Text
      })
    );
  }
}
