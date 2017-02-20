var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NavigationComponent } from "./views/navigation/navigation.component";
import { FormsModule } from "@angular/forms";
import { LoginComponent } from "./views/login/login.component";
import SelectionService from "./views/sessions/session/selection.service";
import { HomeComponent } from "./views/home/home.component";
import { SessionModule } from "./views/sessions/session/session.module";
import { CoreModule } from "./core/core.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AppComponent } from "./app.component";
import { TokenService } from "./core/authentication/token.service";
import { AppRoutingModule } from "./app-routing.module";
import { SessionResolve } from "./views/sessions/session/session.resolve";
export var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        NgModule({
            imports: [
                BrowserModule,
                HttpModule,
                FormsModule,
                CoreModule,
                SessionModule,
                NgbModule.forRoot(),
                AppRoutingModule
            ],
            declarations: [NavigationComponent, LoginComponent, HomeComponent, AppComponent],
            providers: [SelectionService, TokenService, SessionResolve],
            bootstrap: [AppComponent]
        }), 
        __metadata('design:paramtypes', [])
    ], AppModule);
    return AppModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/app.module.js.map