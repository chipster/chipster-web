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
import { Response } from "@angular/http";
import { Observable } from "rxjs";
export var ErrorHandlerService = (function () {
    function ErrorHandlerService() {
    }
    /*
     * @description: handler for http-request catch-clauses
     */
    ErrorHandlerService.prototype.handleError = function (error) {
        var errorMessage;
        if (error instanceof Response) {
            var body = error.json() || '';
            var err = body.error || JSON.stringify(body);
            errorMessage = error.status + " - " + (error.statusText || '') + " " + err;
        }
        else {
            errorMessage = error.message ? error.message : error.toString();
        }
        return Observable.throw(errorMessage);
    };
    ErrorHandlerService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], ErrorHandlerService);
    return ErrorHandlerService;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/core/errorhandler/error-handler.service.js.map