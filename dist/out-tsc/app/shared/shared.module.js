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
import { CommonModule } from '@angular/common';
import { BytesPipe } from "./pipes/bytes.pipe";
import { TrustedResourcePipe } from "./pipes/trustedresource.pipe";
import { IsoDatePipe } from './pipes/iso-date.pipe';
import { DatasetsearchPipe } from './pipes/datasetsearch.pipe';
import { ToolPipe } from './pipes/toolpipe.pipe';
import { PipeService } from "./services/pipeservice.service";
import { ModulePipe } from './pipes/modulepipe.pipe';
import { SecondsPipe } from './pipes/secondspipe.pipe';
import { CategoryPipe } from "./pipes/categorypipe.pipe";
import { TSVReader } from "./services/TSVReader";
import ConfigurationResource from "./resources/configurationresource";
import { CoreModule } from "../core/core.module";
import { ToolResource } from "./resources/toolresource";
import { SessionWorkerResource } from "./resources/sessionworker.resource";
import FileResource from "./resources/fileresource";
import SessionResource from "./resources/session.resource";
import ConfigService from "./services/config.service";
export var SharedModule = (function () {
    function SharedModule() {
    }
    SharedModule = __decorate([
        NgModule({
            imports: [
                CommonModule, CoreModule
            ],
            declarations: [BytesPipe, TrustedResourcePipe, IsoDatePipe, DatasetsearchPipe, ToolPipe, CategoryPipe, ModulePipe, SecondsPipe],
            providers: [PipeService, TSVReader, ConfigurationResource, ToolResource, SessionWorkerResource, FileResource, SessionResource, ConfigService],
            exports: [BytesPipe, TrustedResourcePipe, IsoDatePipe, DatasetsearchPipe, ToolPipe, CategoryPipe, ModulePipe, SecondsPipe]
        }), 
        __metadata('design:paramtypes', [])
    ], SharedModule);
    return SharedModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/shared.module.js.map