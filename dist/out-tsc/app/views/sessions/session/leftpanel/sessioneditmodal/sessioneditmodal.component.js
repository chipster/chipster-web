var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, ElementRef, ViewChild } from "@angular/core";
import { SessionData } from "../../../../../model/session/session-data";
import SessionDataService from "../../sessiondata.service";
export var SessionEditModalComponent = (function () {
    function SessionEditModalComponent(modalService, sessionDataService) {
        this.modalService = modalService;
        this.sessionDataService = sessionDataService;
    }
    SessionEditModalComponent.prototype.openSessionEditModal = function () {
        this.modalRef = this.modalService.open(this.sessionEditModalTemplate);
    };
    SessionEditModalComponent.prototype.save = function () {
        var _this = this;
        this.sessionDataService.updateSession(this.sessionData.session).subscribe(function () {
            _this.modalRef.close();
        });
    };
    ;
    __decorate([
        Input(), 
        __metadata('design:type', SessionData)
    ], SessionEditModalComponent.prototype, "sessionData", void 0);
    __decorate([
        ViewChild('sessionEditModalTemplate'), 
        __metadata('design:type', ElementRef)
    ], SessionEditModalComponent.prototype, "sessionEditModalTemplate", void 0);
    SessionEditModalComponent = __decorate([
        Component({
            selector: 'ch-session-edit-modal',
            templateUrl: './sessioneditmodal.html'
        }), 
        __metadata('design:paramtypes', [NgbModal, SessionDataService])
    ], SessionEditModalComponent);
    return SessionEditModalComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/sessioneditmodal/sessioneditmodal.component.js.map