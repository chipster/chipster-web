import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Module } from "chipster-js-common";
import { Observable, of } from "rxjs";
import { map, mergeMap, shareReplay } from "rxjs/operators";
import { ConfigService } from "../services/config.service";

export interface Quotas {
  memoryRatio: number;
  cpuRatio: number;
  maxSlots: number;
  maxStorage: number;
  defaultSlots: number;
  defaultStorage: number;
}

@Injectable()
export class SchedulerResource {
  private quotasCache: Observable<any>;

  constructor(
    private configService: ConfigService,
    private http: HttpClient,
  ) {}

  getQuotas(): Observable<Quotas> {
    if (this.quotasCache == null) {
      const apiUrl$ = this.configService.getSchedulerUrl();
      this.quotasCache = apiUrl$.pipe(
        mergeMap((apiUrl: string) => this.http.get<Module[]>(`${apiUrl}/quotas`)),
        map((resp) => {
          return {
            memoryRatio: resp["slot-memory"],
            cpuRatio: resp["slot-cpu"],
            maxSlots: resp["max-slots"],
            maxStorage: resp["max-storage"],
            defaultSlots: resp["default-slots"],
            defaultStorage: resp["default-storage"],
          };
        }),
        shareReplay(1),
      );
    }
    return this.quotasCache;
  }
}
