/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HttpQueueService } from './http-queue.service';

describe('HttpQueueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpQueueService]
    });
  });

  it('should ...', inject([HttpQueueService], (service: HttpQueueService) => {
    expect(service).toBeTruthy();
  }));
});
