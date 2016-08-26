import Utils from "./utils.service"

export interface ChangeDetector {
    check: () => void;
}

export class MapChangeDetector {

    lastMap: Map<any, any>;

    /**
     * @param currentMap a funktion which returns the current map instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     */
    constructor(private currentMap: () => Map<any, any>, private onChange: () => void) {
    }

    /**
     * Call the onChange funktion if the current map has changed after the last call of this method
     */
    check() {
        let currentMapValues: Array<any>;
        let lastMapValues: Array<any>;

        if (this.currentMap()) {
            currentMapValues = Utils.mapValues(this.currentMap());
        }

        if (this.lastMap) {
            lastMapValues = Utils.mapValues(this.lastMap);
        }

        if (!angular.equals(currentMapValues, lastMapValues)) {
            this.onChange();
            this.lastMap = new Map(this.currentMap());
        }
    }
}

export class ArrayChangeDetector {

    lastArray: Array<any>;

    /**
     * @param currentArray a funktion which returns the current array instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     */
    constructor(private currentArray: () => Array<any>, private onChange: () => void) {
    }

    /**
     * Call the onChange funktion if the current array has changed after the last call of this method
     */
    check() {
        if (!angular.equals(this.currentArray(), this.lastArray)) {
            this.onChange();
            this.lastArray = angular.extend([], this.currentArray());
        }
    }
}
