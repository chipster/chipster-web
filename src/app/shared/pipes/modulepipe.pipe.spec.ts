/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import {ModulePipe} from "./modulepipe.pipe";
import {PipeService} from "../services/pipeservice.service";

describe('ModulepipePipe', () => {
  const pipe = new ModulePipe(new PipeService());

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
