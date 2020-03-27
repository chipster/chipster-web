import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Service } from "chipster-js-common";
import { mergeMap, tap, catchError, map } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import log from "loglevel"
import { empty, from, Observable } from 'rxjs';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import FileBrokerStorage from './file-broker-storage';

@Component({
  selector: "ch-services",
  templateUrl: "./maintenance.component.html",
  styleUrls: ["./maintenance.component.less"],
  encapsulation: ViewEncapsulation.Emulated
})
export class MaintenanceComponent implements OnInit {

  storageIds = [];
  free = new Map();
  total = new Map();
  idOnStorage = new Map();

  fileBrokerStorages = new Map();
  fileStorageFileStats = new Map();
  sessionDbFileStats = new Map();

  copySource: string;
  copyTarget: string;
  copyMaxSize: string;


  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private tokenService: TokenService
  ) {}

  ngOnInit() {

    let fileBroker: Service;

    this.configService.getInternalService("session-db", this.tokenService.getToken()).pipe(
      mergeMap((service: Service) => {
        return this.authHttpClient.getAuth(service.adminUri + "/admin/storages");
      })
    ).pipe(
      tap((storages: FileStats[]) => {
        storages.forEach(fileStats => {
          log.info("db storage", fileStats);
          this.addStorageId(fileStats.storageId);
          this.sessionDbFileStats.set(fileStats.storageId, fileStats);
        });
      }),
    )
    .subscribe(null,
    err => {
      this.restErrorService.showError("failed to get storages", err);
    });

    this.configService.getInternalService("file-broker", this.tokenService.getToken()).pipe(
      mergeMap((service: Service) => {
        fileBroker = service;
        log.info("get storages: " + fileBroker.adminUri + "/admin/storages");
        return this.authHttpClient.getAuth(fileBroker.adminUri + "/admin/storages");
      })
    ).pipe(
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
    .subscribe(null,
    err => {
      this.restErrorService.showError("failed to get storages", err);
    });
  }

  updateId(storageId: string, fileBroker: Service): Observable<string> {
    return this.authHttpClient.getAuth(
      fileBroker.adminUri + "/admin/storages/" + storageId + "/id"
    ).pipe(      
      catchError(err => {              
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
    return this.authHttpClient.getAuth(
      fileBroker.adminUri + "/admin/storages/" + storageId + "/filestats"
    ).pipe(      
      catchError(err => {              
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
  }

  updateStatus(storageId: string, fileBroker: Service): Observable<string> {
    return this.authHttpClient.getAuth(
        fileBroker.adminUri + "/admin/storages/" + storageId + "/status"
      ).pipe(
        catchError(err => {              
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
    this.backup("backup", "/admin/backup/" + role);
  }

  backupStorage(storageId: string) {
      this.backup("file-broker", "/admin/storages/" + storageId + "/backup");    
  }

  backup(backupService: string, path: string) {
    this.configService
      .getInternalService(backupService, this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.authHttpClient.postAuth(service.adminUri + path, null);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("backup start failed", err)
      );
  }

  deleteOldOrphanFiles(storageId: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.authHttpClient.postAuth(
            service.adminUri + "/admin/storages/" + storageId + "/delete-orphans",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("delete orphans failed", err)
      );
  }

  storageCheck(storageId: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.authHttpClient.postAuth(
            service.adminUri + "/admin/storages/" + storageId + "/check",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("storage check failed", err)
      );
  }

  setCopyTarget(target: string) {
    this.copyTarget = target;
    this.copyMaxSize = "" + BytesPipe.prototype.transform(this.free.get(target), 0);
  }

  /**
   * Don't allow orphan removal if configuration looks suspicious
   * @param storageId
   */
  isOrphanCheckAllowed(storageId: string) {
    return storageId == this.idOnStorage.get(storageId)
  }

  getCopyMaxSize() {    
    let parts = this.copyMaxSize.split(" ");
    if (parts.length >= 1) {
      let number = parseFloat(parts[0]);
      if (parts.length == 1) {
        return number;
      } else if (parts.length == 2) {
        switch (parts[1]) {
          case "k":
          case "kB":
          case "kiB":
          return number * 1024
          case "M":
          case "MB":
          case "MiB":
          return number * 1024 * 1024
          case "G":
          case "GB":
          case "GiB":
          return number * 1024 * 1024 * 1024
          case "T":
          case "TB":
          case "TiB":
          return number * 1024 * 1024 * 1024 * 1024
        }
      } else {
        this.restErrorService.showError("more than two parts " + this.copyMaxSize, null);
      }
    } else {
      return null;
    }
  }

  copy(source: string, target: string) {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {

          let url = service.adminUri + "/admin/storages/copy?source=" + source + "&target=" + target;
          let copyMaxBytes = this.getCopyMaxSize();
          if (copyMaxBytes) {
            url += "&maxBytes=" + copyMaxBytes;
          }
          
          return this.authHttpClient.postAuth(url, null);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("copy failed", err)
      );
  }

  sessionDbCheckOrphans() {
    this.configService
      .getInternalService("session-db", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.authHttpClient.postAuth(
            service.adminUri + "/admin/check-orphans",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("check orphans failed", err)
      );
  }

  sessionDbDeleteOrphans() {
    this.configService
      .getInternalService("session-db", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.authHttpClient.postAuth(
            service.adminUri + "/admin/delete-orphans",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("delete orphans failed", err)
      );
  }
}
export class FileStats {
  storageId: string;
  fileCount: number;
  fileBytes: number;
}
