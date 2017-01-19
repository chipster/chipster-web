
import ConfigService from "../../services/config.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {ResponseContentType} from "@angular/http";

@Injectable()
export default class FileResource {

	constructor(
				private configService: ConfigService,
        private restService: RestService) {
	}

	getData(sessionId: string, datasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {responseType: ResponseContentType.Text}));
  }

  getLimitedData(sessionId: string, datasetId: string, maxBytes: number): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {range: `bytes=0-${maxBytes}`, responseType: ResponseContentType.Text} ));
  }

  uploadData(sessionId: string, datasetId: string, data: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.put(`{url}/sessions/${sessionId}/datasets/${datasetId}`, {data: data},  true ));
  }
}
