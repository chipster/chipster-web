import { async, TestBed } from '@angular/core/testing';
import { HtmlvisualizationComponent } from './htmlvisualization.component';
describe('HtmlvisualizationComponent', function () {
    var component;
    var fixture;
    beforeEach(async(function () {
        TestBed.configureTestingModule({
            declarations: [HtmlvisualizationComponent]
        })
            .compileComponents();
    }));
    beforeEach(function () {
        fixture = TestBed.createComponent(HtmlvisualizationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', function () {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/htmlvisualization/htmlvisualization.component.spec.js.map