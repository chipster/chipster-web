/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import {ToolPipe} from "./toolpipe.pipe";
import {PipeService} from "../services/pipeservice.service";

describe('ToolpipePipe', () => {
  const toolpipe = new ToolPipe(new PipeService());

  it('create an instance', () => {
    expect(toolpipe).toBeTruthy();
  });
});
