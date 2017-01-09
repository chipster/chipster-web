import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthenticationModule} from "./authentication/authentication.module";

@NgModule({
  imports: [
    CommonModule,
    AuthenticationModule
  ],
  declarations: [],
  providers: []
})
export class CoreModule { }
