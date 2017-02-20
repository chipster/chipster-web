var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgModule } from "@angular/core";
import { VisualizationsModule } from "./visualization/visualizations.module";
import { ToolsModule } from "./tools/tools.module";
import { DatasetModule } from "./selectiondetails/dataset.module";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../shared/shared.module";
import { LeftPanelModule } from "./leftpanel/leftpanel.module";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import { SessionListComponent } from "../sessionlist.component";
import { SessionComponent } from "./session.component";
import { OpenSessionFile } from "../opensessionfile/opensessionfile.component";
import UploadService from "../../../shared/services/upload.service";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
export var SessionModule = (function () {
    function SessionModule() {
    }
    SessionModule = __decorate([
        NgModule({
            imports: [CommonModule, VisualizationsModule, ToolsModule, DatasetModule, SharedModule, LeftPanelModule, NgbModule],
            declarations: [SessionComponent, SessionListComponent, OpenSessionFile],
            providers: [SessionEventService, SessionDataService, UploadService]
        }), 
        __metadata('design:paramtypes', [])
    ], SessionModule);
    return SessionModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/session.module.js.map