import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BytesPipe} from "./pipes/bytes.pipe";
import {TrustedResourcePipe} from "./pipes/trustedresource.pipe";
import { IsoDatePipe } from './pipes/iso-date.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [BytesPipe, TrustedResourcePipe, IsoDatePipe],
  exports: [BytesPipe, TrustedResourcePipe, IsoDatePipe]
})
export class SharedModule { }
