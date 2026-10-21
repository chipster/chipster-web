import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Module } from "chipster-js-common";
import { Observable } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { ConfigService } from "../services/config.service";

export interface JobQuota {
  memoryRatio: number;
  cpuRatio: number;
  maxSlots: number;
  maxStorage: number;
  defaultSlots: number;
  defaultStorage: number;
  preferredSlots: number;
  preferredStorage: number;
}

@Injectable({ providedIn: "root" })
export class SchedulerResource {
  private configService = inject(ConfigService);
  private http = inject(HttpClient);

  private jobQuotaCache: Observable<JobQuota>;
  private jobQuotaCacheSync: JobQuota;

  initJobQuota(): Observable<JobQuota> {
    if (this.jobQuotaCache == null) {
      const apiUrl$ = this.configService.getSchedulerUrl();
      this.jobQuotaCache = apiUrl$.pipe(
        mergeMap((apiUrl: string) => this.http.get<Module[]>(`${apiUrl}/jobQuota`)),
        map((resp) => {
          return {
            memoryRatio: resp["slot-memory"],
            cpuRatio: resp["slot-cpu"],
            maxSlots: resp["max-slots"],
            maxStorage: resp["max-storage"],
            defaultSlots: resp["default-slots"],
            defaultStorage: resp["default-storage"],
            preferredSlots: resp["preferred-slots"],
            preferredStorage: resp["preferred-storage"],
          };
        }),
        tap((quotas) => {
          this.jobQuotaCacheSync = quotas;
        }),
        shareReplay(1),
      );
    }
    return this.jobQuotaCache;
  }

  getJobQuota() {
    if (this.jobQuotaCacheSync == null) {
      throw new Error("job quota has not been initialized");
    }
    return this.jobQuotaCacheSync;
  }
}
