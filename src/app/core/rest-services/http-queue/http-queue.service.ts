import { Injectable } from "@angular/core";

@Injectable()
export class HttpQueueService {
  queueSize = 0;

  constructor() {}

  increment() {
    this.queueSize++;
  }

  decrement() {
    this.queueSize--;
  }
}
