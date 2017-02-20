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
export var SecondsPipe = (function () {
    function SecondsPipe() {
    }
    SecondsPipe.prototype.transform = function (seconds) {
        if (isNaN(parseFloat(seconds)) || !isFinite(seconds))
            return '-';
        if (seconds === 0)
            return '';
        var units = ['seconds', 'minutes', 'hours'], number = Math.floor(Math
            .log(seconds)
            / Math.log(60));
        return (seconds / Math.pow(60, Math.floor(number))).toFixed(0) + ' '
            + units[number];
    };
    SecondsPipe = __decorate([
        Pipe({
            name: 'secondspipe'
        }), 
        __metadata('design:paramtypes', [])
    ], SecondsPipe);
    return SecondsPipe;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/secondspipe.pipe.js.map