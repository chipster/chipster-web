import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from "@angular/core";
import { Tool, ToolParameter } from "chipster-js-common";
import { Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { ToolService } from "../tool.service";
import { ValidatedTool } from "../ToolSelection";

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

  slots: number;
  memory: number;
  cpu: number;

  memoryRatio = this.toolService.getMemoryRatio();
  cpuRatio = this.toolService.getCpuRatio();
  maxSlots = this.toolService.getMaxSlots();

  private resourceChangedThrottle = new Subject<any>();

  private unsubscribe: Subject<any> = new Subject();

  // noinspection JSUnusedLocalSymbols
  constructor(public toolService: ToolService) {}

  ngOnInit() {
    this.resourceChangedThrottle
      .asObservable()
      .pipe(debounceTime(500), takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.resourcesChanged.emit();
      });
  }

  ngOnChanges() {
    if (this.validatedTool != null) {
      console.log("ngOnChanges() validated tool", this.validatedTool);
      this.ready = true;
      this.showWarning = !this.validatedTool.resourcesValidation.valid;
      this.warningText = this.validatedTool.resourcesValidation.message;

      let slots = this.validatedTool.tool.slotCount;

      if (slots == null) {
        console.log("slots is null, set to 1");
        slots = 1;
      }
      this.cpu = slots * this.cpuRatio;
      this.memory = slots * this.memoryRatio;
    } else {
      this.ready = false;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  onCpuChanged() {
    // save slots when dataset is changed. It's ugly to modify the tool, but parameters are stored there too
    this.validatedTool.tool.slotCount = this.cpu / this.cpuRatio;

    this.resourceChangedThrottle.next(null);
  }

  onMemoryChanged() {
    // save slots when dataset is changed. It's ugly to modify the tool, but parameters are stored there too
    this.validatedTool.tool.slotCount = this.memory / this.memoryRatio;

    this.resourceChangedThrottle.next(null);
  }

  resetSlots($event?: Event) {
    this.resetAll();
  }

  resetAll() {
    this.validatedTool.tool.slotCount = this.origTool.slotCount;
    this.resourcesChanged.emit();
  }

  isResetAllVisible() {
    return this.origTool.slotCount !== this.validatedTool.tool.slotCount;
  }

  isResetVisible(): boolean {
    return this.isResetAllVisible();
  }

  getSlotsValidation() {
    if (this.validatedTool.resourcesValidation == null) {
      return {
        valid: false,
        message: "Validation failed",
      };
    }
    return this.validatedTool.resourcesValidation;
  }
}
