/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { CategoryPipe } from './categorypipe.pipe';
import {PipeService} from "../services/pipeservice.service";

describe('CategorypipePipe', () => {

  const pipe = new CategoryPipe(new PipeService());

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

});
