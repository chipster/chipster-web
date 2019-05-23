import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpQueueService } from "./http-queue/http-queue.service";
<<<<<<< HEAD
import { RestService } from "./restservice/rest.service";
=======
>>>>>>> 6797bde6db4f4965db655a441a90a8706d6a6995

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [HttpQueueService]
})
export class RestServicesModule { }
