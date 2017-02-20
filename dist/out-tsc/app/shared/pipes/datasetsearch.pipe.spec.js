/* tslint:disable:no-unused-variable */
import { DatasetsearchPipe } from './datasetsearch.pipe';
import { PipeService } from "../services/pipeservice.service";
describe('DatasetsearchPipe', function () {
    var pipe = new DatasetsearchPipe(new PipeService());
    it('create an instance', function () {
        expect(pipe).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/datasetsearch.pipe.spec.js.map