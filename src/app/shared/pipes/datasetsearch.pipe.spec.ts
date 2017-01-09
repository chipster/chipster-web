/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { DatasetsearchPipe } from './datasetsearch.pipe';
import {PipeService} from "./pipeservice.service";

describe('DatasetsearchPipe', () => {

  it('create an instance', () => {
    let pipe = new DatasetsearchPipe(PipeService);
    expect(pipe).toBeTruthy();
  });
});
