///<reference path="pipes/secondspipe.pipe.ts"/>
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BytesPipe} from "./pipes/bytes.pipe";
import {TrustedResourcePipe} from "./pipes/trustedresource.pipe";
import { IsoDatePipe } from './pipes/iso-date.pipe';
import { DatasetsearchPipe } from './pipes/datasetsearch.pipe';
import { ToolPipe } from './pipes/toolpipe.pipe';
import {PipeService} from "./services/pipeservice.service";
import { ModulePipe } from './pipes/modulepipe.pipe';
import {SecondsPipe} from './pipes/secondspipe.pipe';
import {CategoryPipe} from "./pipes/categorypipe.pipe";
import {CSVReader} from "./services/CSVReader";
import {TSVReader} from "./services/TSVReader";
import ConfigurationResource from "./resources/configurationresource";
import {CoreModule} from "../core/core.module";
import {SessionResourceService} from "./resources/session-resource.service";

@NgModule({
  imports: [
    CommonModule, CoreModule
  ],
  declarations: [BytesPipe, TrustedResourcePipe, IsoDatePipe, DatasetsearchPipe, ToolPipe, CategoryPipe, ModulePipe, SecondsPipe],
  providers: [PipeService, TSVReader, CSVReader, ConfigurationResource, SessionResourceService],
  exports: [BytesPipe, TrustedResourcePipe, IsoDatePipe]
})
export class SharedModule {  }
