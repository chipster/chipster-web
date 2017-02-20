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
export var IsoDatePipe = (function () {
    function IsoDatePipe() {
    }
    IsoDatePipe.prototype.transform = function (isoDate) {
        var d = new Date(isoDate);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };
    IsoDatePipe = __decorate([
        Pipe({
            name: 'isodate'
        }), 
        __metadata('design:paramtypes', [])
    ], IsoDatePipe);
    return IsoDatePipe;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/iso-date.pipe.js.map