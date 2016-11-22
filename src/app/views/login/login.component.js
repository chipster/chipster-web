"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var app_constants_1 = require("../../app.constants");
var authenticationservice_1 = require("../../authentication/authenticationservice");
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var LoginComponent = (function () {
    function LoginComponent($location, authenticationService) {
        this.$location = $location;
        this.authenticationService = authenticationService;
    }
    LoginComponent.prototype.login = function (username, password) {
        var _this = this;
        this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).then(function () {
            //Route to Session creation page
            _this.$location.path('/sessions');
        }, function (error) {
            console.log('login failed', error);
            if (error) {
                _this.error = error.status === 403 ? 'Incorrect username or password.' : error.data;
            }
            else {
                _this.error = 'Could not connect to the server ' + app_constants_1.ServiceLocator;
            }
        });
    };
    return LoginComponent;
}());
__decorate([
    core_1.ViewChild('myForm'),
    __metadata("design:type", forms_1.FormGroup)
], LoginComponent.prototype, "myForm", void 0);
LoginComponent = __decorate([
    core_1.Component({
        selector: 'login',
        templateUrl: 'app/views/login/login.html'
    }),
    __param(0, core_1.Inject('$location')), __param(1, core_1.Inject('AuthenticationService')),
    __metadata("design:paramtypes", [Object, authenticationservice_1.default])
], LoginComponent);
exports.LoginComponent = LoginComponent;
//# sourceMappingURL=login.component.js.map