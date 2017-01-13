import {Injectable} from '@angular/core';
import {Headers, RequestOptionsArgs, RequestMethod, Request, RequestOptions, Http, Response} from "@angular/http";
import {Observable} from "rxjs";
import {HttpQueueService} from "../http-queue/http-queue.service";
import {ErrorHandlerService} from "../../errorhandler/error-handler.service";

@Injectable()
export class RestService {

  private static buildRequestOptionArgs(url: string,
                                        method: RequestMethod = RequestMethod.Get,
                                        args: RequestOptionsArgs = {},
                                        data?: any): RequestOptionsArgs {
    args.headers = new Headers(args.headers);
    args.headers.append('Content-Type', 'application/json; charset=UTF-8');
    args.headers.append('Accept', 'application/json; charset=UTF-8');
    args.method = method;
    args.url = url;
    args.body = JSON.stringify(data);
    return args;
  }

  constructor(private httpQueueu: HttpQueueService,
              private errorHandler: ErrorHandlerService,
              private http: Http) {
  }

  /*
   * Create GET http-request
   */
  get(url: string, args?: RequestOptionsArgs): Observable<any> {
    const opts = RestService.buildRequestOptionArgs(url, RequestMethod.Get, args);
    return this.doRequest(new Request(new RequestOptions(opts)));
  }

  /*
   * Create POST http-request
   */
  post(url: string, args?: RequestOptionsArgs): Observable<any> {
    const opts = RestService.buildRequestOptionArgs(url, RequestMethod.Post, args);
    return this.doRequest(new Request(new RequestOptions(opts)))
  }

  /*
   * Create PUT http-request
   */
  put(url: string, args?: RequestOptionsArgs): Observable<any> {
    const opts = RestService.buildRequestOptionArgs(url, RequestMethod.Put, args);
    return this.doRequest(new Request(new RequestOptions(opts)))
  }

  /*
   * Fire the actual http request by given request object and keep track how many request are in queue currently
   */
  private doRequest(request: Request): Observable<any> {
    this.httpQueueu.increment();
    return this.http.request(request).map(
      (response:Response) => {
        const resp: any = response.json();
        if (resp.error) {
          throw resp;
        }
        return resp;
      }
    )
      .catch(this.errorHandler.handleError)
      .finally( () => this.httpQueueu.decrement());
  }

}
