import { async, TestBed } from '@angular/core/testing';
import { ToolsParameterFormComponent } from './tools-parameter-form.component';
describe('ToolsParameterFormComponent', function () {
    var component;
    var fixture;
    beforeEach(async(function () {
        TestBed.configureTestingModule({
            declarations: [ToolsParameterFormComponent]
        })
            .compileComponents();
    }));
    beforeEach(function () {
        fixture = TestBed.createComponent(ToolsParameterFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', function () {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/toolsmodal/tools-parameter-form/tools-parameter-form.component.spec.js.map