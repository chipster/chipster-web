import {Injectable, Inject} from '@angular/core';
import {
  Headers, RequestOptionsArgs, RequestMethod, Request, RequestOptions, Http, Response,
  ResponseContentType
} from "@angular/http";
import {Observable} from "rxjs";
import {HttpQueueService} from "../http-queue/http-queue.service";
import {ErrorHandlerService} from "../../errorhandler/error-handler.service";
import {TokenService} from "../../authentication/token.service";

@Injectable()
export class RestService {

  constructor(private httpQueueu: HttpQueueService,
              private errorHandler: ErrorHandlerService,
              private http: Http,
              private tokenService: TokenService) {}

  /*
   * @description: build request options
   */
  private buildRequestOptionArgs(url: string,
                                  method: RequestMethod = RequestMethod.Get,
                                  requestOptions: RequestOptionsArgs = {},
                                  authentication: boolean = false,
                                  payload?: any): RequestOptionsArgs {
    requestOptions.headers = new Headers(requestOptions.headers);
    requestOptions.headers.append('Content-Type', 'application/json; charset=UTF-8');
    requestOptions.headers.append('Accept', 'application/json; charset=UTF-8');
    if(authentication) {
      requestOptions.headers.append( 'Authorization', this.tokenService.getTokenHeader().Authorization );
    }
    requestOptions.method = method;
    requestOptions.url = url;
    requestOptions.body = JSON.stringify(payload);
    return requestOptions;
  }

  /*
   * @description: Create GET http-request
   */
  get(url: string, authenticationRequired?: boolean, requestOptions?: RequestOptionsArgs): Observable<any> {
    const opts = this.buildRequestOptionArgs(url, RequestMethod.Get, requestOptions, authenticationRequired);
    return this.doRequest(new Request(new RequestOptions(opts)));
  }

  /*
   * @description: Create PUT http-request
   */
  put(url: string, payload: any, authenticationRequired?: boolean, requestOptions?: RequestOptionsArgs): Observable<any> {
    const opts = this.buildRequestOptionArgs(url, RequestMethod.Put, requestOptions, authenticationRequired, payload );
    return this.doRequest(new Request(new RequestOptions(opts)));
  }

  /*
   * @description: Create POST http-request
   */
  post(url: string, payload: any, authenticationRequired?: boolean, requestOptions?: RequestOptionsArgs): Observable<any> {
    const opts = this.buildRequestOptionArgs(url, RequestMethod.Post, requestOptions, authenticationRequired, payload);
    return this.doRequest(new Request(new RequestOptions(opts)));
  }

  /*
   * @description:Create DELETE http-request
   */
  delete(url: string, authenticationRequired?: boolean, requestOptions?: RequestOptionsArgs): Observable<any> {
    const opts = this.buildRequestOptionArgs(url, RequestMethod.Delete, {}, authenticationRequired, requestOptions);
    return this.doRequest(new Request(new RequestOptions(opts)));
  }

  /*
   * @description:Fire the actual http request by given request object
   * and keep track how many request are in queue currently
   */
  private doRequest(request: Request): Observable<any> {
    this.httpQueueu.increment();
    return this.http.request(request).map( (response:Response) => {
        let resp: any;

        // handle response by expected responsetype
        switch(request.responseType) {
          case (ResponseContentType.Json):
            resp = response.json();
            break;
          case (ResponseContentType.Text):
            resp = response.text();
            break;
          case (ResponseContentType.Blob):
            resp = response.blob();
            break;
          case (ResponseContentType.ArrayBuffer):
            resp = response.arrayBuffer();
            break;
          default:
            resp = response.json();
        }

      if (resp && resp.error) {
          throw resp;
        }
        return resp;
      }
    )
      .catch(this.errorHandler.handleError)
      .finally( () => this.httpQueueu.decrement());
  }

}
