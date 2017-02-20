/* tslint:disable:no-unused-variable */
import { ToolPipe } from "./toolpipe.pipe";
import { PipeService } from "../services/pipeservice.service";
describe('ToolpipePipe', function () {
    var toolpipe = new ToolPipe(new PipeService());
    it('create an instance', function () {
        expect(toolpipe).toBeTruthy();
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/pipes/toolpipe.pipe.spec.js.map