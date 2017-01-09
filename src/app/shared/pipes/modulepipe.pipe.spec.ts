/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import {ModulePipe} from "./modulepipe.pipe";
import {PipeService} from "../services/pipeservice.service";

describe('ModulepipePipe', () => {
  it('create an instance', () => {
    let pipe = new ModulePipe(PipeService);
    expect(pipe).toBeTruthy();
  });
});
