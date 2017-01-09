/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { DatasetsearchPipe } from './datasetsearch.pipe';
import {PipeService} from "../services/pipeservice.service";

describe('DatasetsearchPipe', () => {
  const pipe = new DatasetsearchPipe(new PipeService());

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
