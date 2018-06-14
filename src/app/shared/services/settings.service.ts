import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Injectable } from "@angular/core";

@Injectable()
export class SettingsService {
  public showToolsPanel$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public splitSelectionPanel$: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  public alwaysShowFileDetails$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public alwaysShowTools$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
}
