import Utils from "./utils.service"

export interface ChangeDetector {
    check: () => void;
}

export class MapChangeDetector {

    lastMapValues: Array<any>;

    /**
     * @param currentMap a funktion which returns the current map instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     * @param comparison comparison type
     */
    constructor(private currentMap: () => Map<any, any>, private onChange: () => void, private comparison: Comparison) {
    }

    /**
     * Call the onChange funktion if the current map has changed after the last call of this method
     */
    check() {
        let currentMapValues: Array<any>;

        if (this.currentMap()) {
            currentMapValues = Utils.mapValues(this.currentMap());
        }

        if (!angular.equals(currentMapValues, this.lastMapValues)) {
            this.onChange();
            if (this.comparison === Comparison.Deep) {
                // we need a deep copy to notice changes in the deep
                this.lastMapValues = _.cloneDeep(currentMapValues);
            } else if (this.comparison == Comparison.Shallow) {
                // the current instance is fine, because a new one is created on each call
                this.lastMapValues = currentMapValues;
            }
        }
    }
}

export class ArrayChangeDetector {

    lastArray: Array<any>;

    /**
     * @param currentArray a funktion which returns the current array instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     * @param comparison comparison type
     */
    constructor(private currentArray: () => Array<any>, private onChange: () => void, private comparison: Comparison) {
    }

    /**
     * Call the onChange funktion if the current array has changed after the last call of this method
     */
    check() {

        if (!angular.equals(this.currentArray(), this.lastArray)) {
            this.onChange();
            if (this.comparison === Comparison.Shallow) {
                // a copy of the array is needed to store the last state safely
                this.lastArray = _.concat([], this.currentArray());
            } else if (this.comparison === Comparison.Deep) {
                // we need a deep copy to notice changes in the deep
                this.lastArray = _.cloneDeep(this.currentArray());
            }
        }
    }
}

export enum Comparison { Shallow, Deep }
