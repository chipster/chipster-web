var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ServiceLocator } from "../../core/app.constants";
import AuthenticationService from "../../core/authentication/authenticationservice";
import { Component, ViewChild } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { Router } from "@angular/router";
export var LoginComponent = (function () {
    function LoginComponent(router, authenticationService) {
        this.router = router;
        this.authenticationService = authenticationService;
    }
    LoginComponent.prototype.login = function (username, password) {
        var _this = this;
        this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe(function () {
            //Route to Session creation page
            _this.router.navigate(['/sessions']);
        }, function (error) {
            console.log('login failed', error);
            if (error) {
                _this.error = error.status === 403 ? 'Incorrect username or password.' : error.data;
            }
            else {
                _this.error = 'Could not connect to the server ' + ServiceLocator;
            }
        });
    };
    __decorate([
        ViewChild('myForm'), 
        __metadata('design:type', FormGroup)
    ], LoginComponent.prototype, "myForm", void 0);
    LoginComponent = __decorate([
        Component({
            selector: 'ch-login',
            templateUrl: './login.html'
        }), 
        __metadata('design:paramtypes', [Router, AuthenticationService])
    ], LoginComponent);
    return LoginComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/login/login.component.js.map