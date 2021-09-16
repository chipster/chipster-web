import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { HttpQueueService } from "./http-queue/http-queue.service";

@NgModule({
  imports: [CommonModule],
  providers: [HttpQueueService],
})
export class RestServicesModule {}
