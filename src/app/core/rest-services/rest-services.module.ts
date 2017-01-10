import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RestService} from "./restservice/rest.service";
import {HttpQueueService} from "./http-queue/http-queue.service";

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [HttpQueueService, RestService]
})
export class RestServicesModule { }
