import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpQueueService } from "./http-queue/http-queue.service";
import { RestService } from "./restservice/rest.service";

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [HttpQueueService, RestService]
})
export class RestServicesModule { }
