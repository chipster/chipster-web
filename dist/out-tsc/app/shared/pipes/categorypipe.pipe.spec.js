/* tslint:disable:no-unused-variable */
import { CategoryPipe } from './categorypipe.pipe';
import { PipeService } from "../services/pipeservice.service";
describe('CategorypipePipe', function () {
    var pipe = new CategoryPipe(new PipeService());
    it('create an instance', function () {
        expect(pipe).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/categorypipe.pipe.spec.js.map