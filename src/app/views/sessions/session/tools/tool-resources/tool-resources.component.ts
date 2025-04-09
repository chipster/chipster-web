import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from "@angular/core";
import { ToolParameter } from "chipster-js-common";
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

  @Output() resourcesChanged: EventEmitter<any> = new EventEmitter();

  ready = false;
  showWarning: boolean;
  warningText: string;

  slots: number;
  memory: number;
  cpu: number;

  memoryRatio = 8;
  cpuRatio = 2;
  maxSlots = 10;

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
      console.log("validated tool", this.validatedTool);
      this.ready = true;
      this.showWarning = !this.validatedTool.resourcesValidation.valid;
      this.warningText = this.validatedTool.resourcesValidation.message;

      let slots = this.validatedTool.resources.slotCount;

      if (slots == null) {
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
    this.validatedTool.resources.slotCount = this.cpu / this.cpuRatio;
    this.resourceChangedThrottle.next(null);
  }

  onMemoryChanged() {
    this.validatedTool.resources.slotCount = this.memory / this.memoryRatio;
    this.resourceChangedThrottle.next(null);
  }

  resetSlots($event?: Event) {
    this.resetAll();
  }

  resetAll() {
    this.validatedTool.resources.slotCount = this.validatedTool.tool.slotCount;
    this.resourcesChanged.emit();
  }

  isResetAllVisible() {
    return this.validatedTool?.tool?.slotCount !== this.validatedTool?.resources?.slotCount;
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
