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
export var ToolListItemComponent = (function () {
    function ToolListItemComponent() {
    }
    ToolListItemComponent.prototype.ngOnInit = function () { };
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], ToolListItemComponent.prototype, "color", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], ToolListItemComponent.prototype, "categoryname", void 0);
    ToolListItemComponent = __decorate([
        Component({
            selector: 'ch-tool-list-item',
            template: "\n    <span><span class=\"circle\" [ngStyle]=\"{'background-color': color}\"></span> {{categoryname}}</span>\n  ",
            styles: ["\n    .circle {\n        border-radius: 50%;\n        height: 5px;\n        width: 5px;\n        display: inline-block;\n        margin-bottom: 3px;\n    }\n  "],
        }), 
        __metadata('design:paramtypes', [])
    ], ToolListItemComponent);
    return ToolListItemComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/toolsmodal/tool-list-item/tool-list-item.component.js.map