import { async, TestBed } from '@angular/core/testing';
import { DatasetParameterListComponent } from './dataset-parameter-list.component';
describe('DatasetParameterListComponent', function () {
    var component;
    var fixture;
    beforeEach(async(function () {
        TestBed.configureTestingModule({
            declarations: [DatasetParameterListComponent]
        })
            .compileComponents();
    }));
    beforeEach(function () {
        fixture = TestBed.createComponent(DatasetParameterListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', function () {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/dataset-parameter-list/dataset-parameter-list.component.spec.js.map