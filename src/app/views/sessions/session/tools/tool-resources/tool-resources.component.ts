import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from "@angular/core";
import { Tool } from "chipster-js-common";
import { Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { ToolService } from "../tool.service";
import { ValidatedTool } from "../ToolSelection";
import log from "loglevel";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { JobQuota, SchedulerResource } from "../../../../../shared/resources/scheduler-resource";

interface Resource {
  title: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  outputRatio: number;
}

interface Resources {
  cpu: Resource;
  memory: Resource;
  storage: Resource;
}
@Component({
  selector: "ch-tool-resources",
  templateUrl: "./tool-resources.component.html",
  styleUrls: ["./tool-resources.component.less"],
})
export class ToolResourcesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() validatedTool: ValidatedTool;
  @Input() origTool: Tool;

  @Output() resourcesChanged: EventEmitter<any> = new EventEmitter();

  ready = false;
  showWarning: boolean;
  warningText: string;

  resources: Resources;

  private resourceChangedThrottle = new Subject<any>();

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public toolService: ToolService,
    private schedulerResource: SchedulerResource,
    private restErrorService: RestErrorService,
  ) {}

  ngOnInit() {
    this.resourceChangedThrottle
      .asObservable()
      .pipe(debounceTime(500), takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.resourcesChanged.emit();
      });
  }

  ngOnChanges() {
    const quotas = this.schedulerResource.getJobQuota();

    this.resources = {
      memory: {
        title: "Memory",
        description: "Maximum amount of memory (RAM) for the tool (GiB). Memory and CPU are adjusted together.",
        min: quotas.memoryRatio,
        max: quotas.memoryRatio * quotas.maxSlots,
        step: quotas.memoryRatio,
        value: null,
        outputRatio: quotas.memoryRatio,
      },
      cpu: {
        title: "CPU",
        description: "Maximum number of CPU cores the tool is allowed to use. Memory and CPU are adjusted together.",
        min: quotas.cpuRatio,
        max: quotas.cpuRatio * quotas.maxSlots,
        step: quotas.cpuRatio,
        value: null,
        outputRatio: quotas.cpuRatio,
      },
      storage: {
        title: "Storage",
        description: "Maximum amount of file storage for the tool (GiB).",
        min: quotas.defaultStorage,
        max: quotas.maxStorage,
        step: quotas.defaultStorage,
        value: null,
        outputRatio: 1,
      },
    };

    if (this.validatedTool != null) {
      this.ready = true;
      this.showWarning = !this.validatedTool.resourcesValidation.valid;
      this.warningText = this.validatedTool.resourcesValidation.message;

      let slots = this.validatedTool.tool.slotCount;

      if (slots == null) {
        // log.info("slots is null, set to " + this.defaultSlots);
        slots = quotas.defaultSlots;
      }

      this.resources.cpu.value = slots * quotas.cpuRatio;
      this.resources.memory.value = slots * quotas.memoryRatio;

      let storage = this.validatedTool.tool.storage;

      if (storage == null) {
        // log.info("storage is null, set to " + this.defaultStorage);
        storage = quotas.defaultStorage;
      }

      this.resources.storage.value = storage;
    } else {
      this.ready = false;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  onResourceChanged(id: string) {
    // it's ugly to modify the tool, but parameters are stored there too
    switch (id) {
      case "memory":
        this.validatedTool.tool.slotCount = this.resources[id].value / this.resources[id].outputRatio;
        break;
      case "cpu":
        this.validatedTool.tool.slotCount = this.resources[id].value / this.resources[id].outputRatio;
        break;
      case "storage":
        this.validatedTool.tool.storage = this.resources[id].value / this.resources[id].outputRatio;
        break;
    }

    this.resourceChangedThrottle.next(null);
  }

  reset(id: string) {
    switch (id) {
      case "memory":
      case "cpu":
        this.resetSlots();
        break;
      case "storage":
        this.resetStorage();
        break;
    }

    this.resourcesChanged.emit();
  }

  isResetVisible(id: string): boolean {
    switch (id) {
      case "memory":
      case "cpu":
        return this.isResetSlotsVisible();
      case "storage":
        return this.isResetStorageVisible();
    }
  }

  getResourceValidation(id: string) {
    switch (id) {
      case "memory":
      case "cpu":
        return this.validatedTool.resourcesValidationResults.get("slots");
      case "storage":
        return this.validatedTool.resourcesValidationResults.get("storage");
    }
  }

  resetAll() {
    this.resetSlots();
    this.resetStorage();
    this.resourcesChanged.emit();
  }

  resetSlots() {
    this.validatedTool.tool.slotCount = this.origTool.slotCount;
  }
  resetStorage() {
    this.validatedTool.tool.storage = this.origTool.storage;
  }

  isResetSlotsVisible() {
    return this.origTool.slotCount !== this.validatedTool.tool.slotCount;
  }

  isResetStorageVisible() {
    return this.origTool.storage !== this.validatedTool.tool.storage;
  }

  isResetAllVisible() {
    return this.isResetSlotsVisible() || this.isResetStorageVisible();
  }

  keys(obj: any) {
    return Object.keys(obj);
  }
}
