import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BytesPipe} from "./pipes/bytes.pipe";
import {TrustedResourcePipe} from "./pipes/trustedresource.pipe";
import { IsoDatePipe } from './pipes/iso-date.pipe';
import { DatasetsearchPipe } from './pipes/datasetsearch.pipe';
import { ToolfilterPipe } from './pipes/toolfilter.pipe';
import { CategorypipePipe } from './pipes/categorypipe.pipe';
import { ToolpipePipe } from './pipes/toolpipe.pipe';
import {PipeService} from "./pipes/pipeservice.service";
import { ModulepipePipe } from './pipes/modulepipe.pipe';
import { SecondspipePipe } from './pipes/secondspipe.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [BytesPipe, TrustedResourcePipe, IsoDatePipe, DatasetsearchPipe, ToolfilterPipe, CategorypipePipe, ToolpipePipe, PipeService, ModulepipePipe, SecondspipePipe],
  exports: [BytesPipe, TrustedResourcePipe, IsoDatePipe]
})
export class SharedModule { }
