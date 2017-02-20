var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { Headers, RequestMethod, Request, RequestOptions, Http, ResponseContentType } from "@angular/http";
import { HttpQueueService } from "../http-queue/http-queue.service";
import { ErrorHandlerService } from "../../errorhandler/error-handler.service";
import { TokenService } from "../../authentication/token.service";
export var RestService = (function () {
    function RestService(httpQueueu, errorHandler, http, tokenService) {
        this.httpQueueu = httpQueueu;
        this.errorHandler = errorHandler;
        this.http = http;
        this.tokenService = tokenService;
    }
    /*
     * @description: build request options
     */
    RestService.prototype.buildRequestOptionArgs = function (url, method, requestOptions, authentication, payload, jsonRequest) {
        if (method === void 0) { method = RequestMethod.Get; }
        if (requestOptions === void 0) { requestOptions = {}; }
        if (authentication === void 0) { authentication = false; }
        if (jsonRequest === void 0) { jsonRequest = true; }
        requestOptions.headers = new Headers(requestOptions.headers);
        if (jsonRequest) {
            requestOptions.headers.append('Content-Type', 'application/json; charset=UTF-8');
        }
        if (requestOptions.responseType === ResponseContentType.Json) {
            requestOptions.headers.append('Accept', 'application/json; charset=UTF-8');
        }
        if (authentication) {
            requestOptions.headers.append('Authorization', this.tokenService.getTokenHeader().Authorization);
        }
        requestOptions.method = method;
        requestOptions.url = url;
        if (jsonRequest) {
            requestOptions.body = JSON.stringify(payload);
        }
        else {
            requestOptions.body = payload;
        }
        return requestOptions;
    };
    /*
     * @description: Create GET http-request
     */
    RestService.prototype.get = function (url, authenticationRequired, requestOptions) {
        var opts = this.buildRequestOptionArgs(url, RequestMethod.Get, requestOptions, authenticationRequired);
        return this.doRequest(new Request(new RequestOptions(opts)));
    };
    /*
     * @description: Create PUT http-request
     */
    RestService.prototype.put = function (url, payload, authenticationRequired, requestOptions, jsonRequest) {
        var opts = this.buildRequestOptionArgs(url, RequestMethod.Put, requestOptions, authenticationRequired, payload, jsonRequest);
        return this.doRequest(new Request(new RequestOptions(opts)));
    };
    /*
     * @description: Create POST http-request
     */
    RestService.prototype.post = function (url, payload, authenticationRequired, requestOptions) {
        var opts = this.buildRequestOptionArgs(url, RequestMethod.Post, requestOptions, authenticationRequired, payload);
        return this.doRequest(new Request(new RequestOptions(opts)));
    };
    /*
     * @description:Create DELETE http-request
     */
    RestService.prototype.delete = function (url, authenticationRequired, requestOptions) {
        var opts = this.buildRequestOptionArgs(url, RequestMethod.Delete, {}, authenticationRequired, requestOptions);
        return this.doRequest(new Request(new RequestOptions(opts)));
    };
    /*
     * @description:Fire the actual http request by given request object
     * and keep track how many request are in queue currently
     */
    RestService.prototype.doRequest = function (request) {
        var _this = this;
        this.httpQueueu.increment();
        return this.http.request(request).map(function (response) {
            var resp;
            // handle response by expected responsetype
            switch (request.responseType) {
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
        })
            .catch(this.errorHandler.handleError)
            .finally(function () { return _this.httpQueueu.decrement(); });
    };
    RestService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [HttpQueueService, ErrorHandlerService, Http, TokenService])
    ], RestService);
    return RestService;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/core/rest-services/restservice/rest.service.js.map