/* tslint:disable:no-unused-variable */
import { ModulePipe } from "./modulepipe.pipe";
import { PipeService } from "../services/pipeservice.service";
describe('ModulepipePipe', function () {
    var pipe = new ModulePipe(new PipeService());
    it('create an instance', function () {
        expect(pipe).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/modulepipe.pipe.spec.js.map