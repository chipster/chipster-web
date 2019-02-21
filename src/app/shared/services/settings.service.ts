import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Injectable } from "@angular/core";

export enum SessionListMode {
  CLICK_TO_OPEN_HOVER_TO_PREVIEW = "Click to open, hover to preview",
  CLICK_TO_OPEN_BUTTON_TO_PREVIEW = "Click to open, button to preview",
  CLICK_TO_PREVIEW_BUTTON_TO_OPEN = "Click to preview, button to open"
}

@Injectable()
export class SettingsService {
  public showToolsPanel$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public splitSelectionPanel$: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );

  public alwaysShowFileDetails$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  public compactToolList$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  public sessionListMode$: BehaviorSubject<
    SessionListMode
  > = new BehaviorSubject(SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN);

  public showDatasetSelectionTooltip$: BehaviorSubject<boolean> = new BehaviorSubject(false);
}
