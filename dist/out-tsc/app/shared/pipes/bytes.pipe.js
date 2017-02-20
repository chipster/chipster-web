var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Pipe } from "@angular/core";
export var BytesPipe = (function () {
    function BytesPipe() {
    }
    BytesPipe.prototype.transform = function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
            return '-';
        if (bytes === 0)
            return '';
        if (typeof precision === 'undefined')
            precision = 1;
        if (bytes < 0) {
            // log not defined for negative values
            return bytes;
        }
        // for example, let's convert number 340764 to precision 0
        // we can calculate base 1k logarithm using any other log function
        var log1k = Math.log(bytes) / Math.log(1024); // 1.837...
        var exponent = Math.floor(log1k); // 1
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var unit = units[exponent]; // kB
        var scaled = bytes / Math.pow(1024, exponent); // 332.77...
        var rounded = scaled.toFixed(precision); // 333
        return rounded + ' ' + unit;
    };
    ;
    BytesPipe = __decorate([
        Pipe({ name: 'bytes' }), 
        __metadata('design:paramtypes', [])
    ], BytesPipe);
    return BytesPipe;
}());
;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/bytes.pipe.js.map