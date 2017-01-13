/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SessionResourceService } from './session-resource.service';

describe('SessionResourceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionResourceService]
    });
  });

  it('should ...', inject([SessionResourceService], (service: SessionResourceService) => {
    expect(service).toBeTruthy();
  }));
});
