import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Service } from "chipster-js-common";
import log from "loglevel";
import { empty, from, Observable } from "rxjs";
import { catchError, map, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import FileBrokerStorage from "./file-broker-storage";

@Component({
  selector: "ch-services",
  templateUrl: "./maintenance.component.html",
  styleUrls: ["./maintenance.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class MaintenanceComponent implements OnInit {
  storageIds = [];
  free = new Map();
  total = new Map();

  idOnStorage = new Map();
  schedule = new Map();

  fileBrokerStorages = new Map();
  fileStorageFileStats = new Map();
  sessionDbFileStats = new Map();

  copySource: string;
  copyTarget: string;
  copyMaxSize: number;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private tokenService: TokenService,
  ) {}

  ngOnInit() {
    let fileBroker: Service;

    this.configService
      .getInternalService("session-db", this.tokenService.getToken())
      .pipe(mergeMap((service: Service) => this.authHttpClient.getAuth(service.adminUri + "/admin/storages")))
      .subscribe({
        next: (storages: FileStats[]) => {
          storages.forEach((fileStats) => {
            log.info("db storage", fileStats);
            this.addStorageId(fileStats.storageId);
            this.sessionDbFileStats.set(fileStats.storageId, fileStats);
          });
        },
        error: (err) => {
          this.restErrorService.showError("failed to get storages", err);
        },
      });

    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          fileBroker = service;
          log.info("get storages: " + fileBroker.adminUri + "/admin/storages");
          return this.authHttpClient.getAuth(fileBroker.adminUri + "/admin/storages");
        }),
      )
      .pipe(
        tap((storages: FileBrokerStorage[]) => {
          log.info("file-broker storages", storages);
          storages.forEach((storage: FileBrokerStorage) => {
            this.addStorageId(storage.storageId);
            this.fileBrokerStorages.set(storage.storageId, storage);
          });
        }),
        mergeMap((storages: FileBrokerStorage[]) => from(storages)),
        mergeMap((storage: FileBrokerStorage) => this.updateStatus(storage.storageId, fileBroker)),
        mergeMap((storageId: string) => this.updateId(storageId, fileBroker)),
        mergeMap((storageId: string) => this.updateFileStorageFileStats(storageId, fileBroker)),
      )
      .subscribe({
        next: (value) => {
          const storagesSorted = Array.from(this.free)
            .map(([storageId, freeSpace]) => ({ storageId, freeSpace }))
            .sort((a, b) => a.freeSpace - b.freeSpace);

          const leastFreeStorageId: string = storagesSorted[0].storageId;
          const mostFreeStorageId: string = storagesSorted[storagesSorted.length - 1].storageId;

          this.copySource = leastFreeStorageId;
          this.setCopyTarget(mostFreeStorageId);
        },
        error: (err) => {
          this.restErrorService.showError("failed to get storages", err);
        },
      });
  }

  updateId(storageId: string, fileBroker: Service): Observable<string> {
    return this.authHttpClient.getAuth(fileBroker.adminUri + "/admin/storages/" + storageId + "/id").pipe(
      catchError((err) => {
        log.error("storage id request error", err);
        // don't cancel other requests even if one of them fails
        return empty();
      }),
      map((idResp: Object) => idResp["storageId"]),
      tap((idOnStorage: string) => {
        this.idOnStorage.set(storageId, idOnStorage);
      }),
      map(() => storageId),
    );
  }

  updateFileStorageFileStats(storageId: string, fileBroker: Service): Observable<string> {
    return this.authHttpClient.getAuth(fileBroker.adminUri + "/admin/storages/" + storageId + "/filestats").pipe(
      catchError((err) => {
        log.error("file stats request error", err);
        // don't cancel other requests even if one of them fails
        return empty();
      }),
      tap((fileStats: FileStats) => {
        this.fileStorageFileStats.set(storageId, fileStats);
      }),
      map(() => storageId),
    );
  }

  addStorageId(storageId: string) {
    log.info("add storageId", storageId, this.storageIds.indexOf(storageId));
    if (this.storageIds.indexOf(storageId) == -1) {
      this.storageIds.push(storageId);
    }

    this.storageIds.sort();
  }

  updateStatus(storageId: string, fileBroker: Service): Observable<string> {
    return this.authHttpClient.getAuth(fileBroker.adminUri + "/admin/storages/" + storageId + "/status").pipe(
      catchError((err) => {
        log.error("storage status request error", err);
        // don't cancel other requests even if one of them fails
        return empty();
      }),
      tap((status: Object) => {
        this.free.set(storageId, status["diskFree,fs=storage"]);
        this.total.set(storageId, status["diskTotal,fs=storage"]);
      }),
      map(() => storageId),
    );
  }

  backupDb(role: string) {
    // the backup service takes care of db backups
    this.backup("backup", "/admin/backup/" + role).subscribe(null, (err) =>
      this.restErrorService.showError("backup start failed", err),
    );
  }

  backupStorage(storageId: string) {
    this.backup("file-broker", "/admin/storages/" + storageId + "/backup")
      .pipe(mergeMap(() => this.updateFileStorageFileStatsOfOne(storageId)))
      .subscribe(null, (err) => this.restErrorService.showError("backup start failed", err));
  }

  backup(backupService: string, path: string) {
    return this.configService
      .getInternalService(backupService, this.tokenService.getToken())
      .pipe(mergeMap((service: Service) => this.authHttpClient.postAuth(service.adminUri + path, null)));
  }

  updateFileStorageFileStatsOfOne(storageId: string) {
    let fileBroker = null;
    return this.configService.getInternalService("file-broker", this.tokenService.getToken()).pipe(
      tap((service: Service) => {
        fileBroker = service;
      }),
      mergeMap(() => this.updateFileStorageFileStats(storageId, fileBroker)),
    );
  }

  disableBackups(storageId: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) =>
          this.authHttpClient.deleteAuth(service.adminUri + "/admin/storages/" + storageId + "/backup/schedule"),
        ),
        mergeMap(() => this.updateFileStorageFileStatsOfOne(storageId)),
      )
      .subscribe(null, (err) => this.restErrorService.showError("disable backup failed", err));
  }

  enableBackups(storageId: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) =>
          this.authHttpClient.postAuth(service.adminUri + "/admin/storages/" + storageId + "/backup/schedule", null),
        ),
        mergeMap(() => this.updateFileStorageFileStatsOfOne(storageId)),
      )
      .subscribe(null, (err) => this.restErrorService.showError("disable backup failed", err));
  }

  deleteOldOrphanFiles(storageId: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) =>
          this.authHttpClient.postAuth(service.adminUri + "/admin/storages/" + storageId + "/delete-orphans", null),
        ),
      )
      .subscribe(null, (err) => this.restErrorService.showError("delete orphans failed", err));
  }

  storageCheck(
    storageId: string,
    deleteDatasetsOfMissingFiles: boolean,
    checksums: boolean,
    uploadMaxHours: number | null,
  ) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          var url = service.adminUri + "/admin/storages/" + storageId + "/check";
          if (deleteDatasetsOfMissingFiles) {
            url += "?deleteDatasetsOfMissingFiles=true";
          }

          if (checksums) {
            url += "?checksums=true";
          }

          if (uploadMaxHours) {
            url += "?uploadMaxHours=" + uploadMaxHours;
          }
          return this.authHttpClient.postAuth(url, null);
        }),
      )
      .subscribe(null, (err) => this.restErrorService.showError("storage check failed", err));
  }

  setCopyTarget(target: string) {
    this.copyTarget = target;

    const totalFree = Array.from(this.free.values()).reduce((sum, value) => (sum += value), 0);
    const preferredFree = totalFree / this.free.size;
    const sourceFree = this.free.get(this.copySource);
    const targetFree = this.free.get(this.copyTarget);

    const sourceToPreferred = preferredFree - sourceFree;
    const targetToPreferred = targetFree - preferredFree;

    const smallestCopyMax = Math.floor(Math.min(sourceToPreferred, targetToPreferred));

    this.copyMaxSize = smallestCopyMax;
  }

  /**
   * Don't allow orphan removal if configuration looks suspicious
   * @param storageId
   */
  isOrphanCheckAllowed(storageId: string) {
    return storageId == this.idOnStorage.get(storageId);
  }

  isBackupNowAllowed(storageId: string) {
    return !this.isS3Storage(storageId);
  }

  isBackupEnableAllowed(storageId: string) {
    return !this.isS3Storage(storageId) && !this.isBackupScheduled(storageId);
  }

  isBackupDisableAllowed(storageId: string) {
    return !this.isS3Storage(storageId) && this.isBackupScheduled(storageId);
  }

  isS3Storage(storageId: string) {
    return storageId.startsWith("s3");
  }

  isBackupScheduled(storageId: string) {
    return this.fileStorageFileStats.get(storageId)?.status;
  }

  copy(source: string, target: string) {
    // sanity checks
    if (source == null || source.length < 1 || target == null || target.length < 1 || source === target) {
      log.error("invalid copy source or target", source, target);
      return;
    }
    const requestedCopyMax = this.copyMaxSize ? this.copyMaxSize : this.total.get(source) - this.free.get(source);
    const targetFree = this.free.get(target);

    if (requestedCopyMax > targetFree) {
      log.error(
        "requested to copy",
        this.copyMaxSize,
        "bytes from",
        source,
        "but target",
        target,
        "has only",
        this.free.get(target),
        "bytes free, aborting copy",
      );
      return;
    }

    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          let url = service.adminUri + "/admin/storages/copy?source=" + source + "&target=" + target;
          const copyMaxBytes = this.copyMaxSize;
          if (this.copyMaxSize) {
            url += "&maxBytes=" + copyMaxBytes;
          }

          return this.authHttpClient.postAuth(url, null);
        }),
      )
      .subscribe(null, (err) => this.restErrorService.showError("copy failed", err));
  }

  sessionDbCheckOrphans() {
    this.configService
      .getInternalService("session-db", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => this.authHttpClient.postAuth(service.adminUri + "/admin/check-orphans", null)),
      )
      .subscribe(null, (err) => this.restErrorService.showError("check orphans failed", err));
  }

  sessionDbDeleteOrphans() {
    this.configService
      .getInternalService("session-db", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => this.authHttpClient.postAuth(service.adminUri + "/admin/delete-orphans", null)),
      )
      .subscribe(null, (err) => this.restErrorService.showError("delete orphans failed", err));
  }
}
export class FileStats {
  storageId: string;
  fileCount: number;
  fileBytes: number;
  status: string;
}
