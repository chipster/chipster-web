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
export var DatasetParameterListComponent = (function () {
    function DatasetParameterListComponent() {
        this.defaultLimit = 3;
    }
    DatasetParameterListComponent.prototype.ngOnInit = function () {
        this.limit = this.defaultLimit;
        this.buttonText = 'Show all';
    };
    DatasetParameterListComponent.prototype.toggleParameterList = function () {
        if (this.limit === this.defaultLimit) {
            this.limit = this.parameters.length;
            this.buttonText = 'Hide';
        }
        else {
            this.limit = this.defaultLimit;
            this.buttonText = 'Show all';
        }
    };
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], DatasetParameterListComponent.prototype, "parameters", void 0);
    DatasetParameterListComponent = __decorate([
        Component({
            selector: 'ch-dataset-parameter-list',
            template: "<span class=\"h5\">\n                Parameters\n                <span class=\"lighter\" *ngIf=\"parameters.length > defaultLimit\"> {{limit}} of {{parameters.length}}</span>\n             </span>\n             <span *ngIf=\"parameters.length > defaultLimit\" ><a class=\"pull-right\" (click)=\"toggleParameterList()\">{{buttonText}}</a></span>\n                \n             <table class=\"table table-condensed parameter-table\">\n                <tr *ngFor=\"let param of parameters; let i = index\">\n                   <template [ngIf]=\"i < limit\">\n                      <td>{{param.displayName}}</td>\n                         <td>{{param.value}}</td>\n                   </template>\n                </tr>\n             </table>"
        }), 
        __metadata('design:paramtypes', [])
    ], DatasetParameterListComponent);
    return DatasetParameterListComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/dataset-parameter-list/dataset-parameter-list.component.js.map