var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Pipe } from '@angular/core';
import { PipeService } from "../services/pipeservice.service";
export var ModulePipe = (function () {
    function ModulePipe(pipeService) {
        this.pipeService = pipeService;
    }
    ModulePipe.prototype.transform = function (modules, searchWord) {
        return searchWord ? this.pipeService.findModulesContainingTool(modules, searchWord) : modules;
    };
    ModulePipe = __decorate([
        Pipe({
            name: 'modulepipe'
        }), 
        __metadata('design:paramtypes', [PipeService])
    ], ModulePipe);
    return ModulePipe;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/modulepipe.pipe.js.map