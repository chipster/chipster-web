var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { timeout } from "d3-timer";
import { TokenService } from "../../../../../core/authentication/token.service";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
export var HtmlvisualizationComponent = (function () {
    function HtmlvisualizationComponent(tokenService, sessionDataService) {
        this.tokenService = tokenService;
        this.sessionDataService = sessionDataService;
        this.wrapperUrl = 'assets/htmlvisualizationwrapper.html';
    }
    HtmlvisualizationComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.token = this.tokenService.getToken();
        this.sessionDataService.getDatasetUrl(this.dataset).subscribe(function (url) {
            _this.src = url;
        });
    };
    HtmlvisualizationComponent.prototype.run = function (htmlframe) {
        var _this = this;
        timeout(function () {
            var height = htmlframe.contentWindow.document.body.style.height;
            if (height) {
                htmlframe.height = height + 'px';
            }
            else {
                _this.run(htmlframe);
            }
        }, 100);
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], HtmlvisualizationComponent.prototype, "dataset", void 0);
    HtmlvisualizationComponent = __decorate([
        Component({
            selector: 'ch-htmlvisualization',
            template: "<iframe #htmlframe width=\"100%\" [src]=\"wrapperUrl + '?location=' + src + '&token=' + this.token | trustedresource\" scrolling=\"no\" frameborder=\"0\" (load)=\"run(htmlframe)\"></iframe>"
        }), 
        __metadata('design:paramtypes', [TokenService, SessionDataService])
    ], HtmlvisualizationComponent);
    return HtmlvisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/htmlvisualization/htmlvisualization.component.js.map