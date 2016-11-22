

export default class Vector2d {
    get i(): number {
        return this._i;
    }

    set i(value: number) {
        this._i = value;
    }

    get j(): number {
        return this._j;
    }

    set j(value: number) {
        this._j = value;
    }

    constructor(private _i: number, private _j: number) {
        _i;
        _j;
    }

    /*
     * @description: crossproduct of this and other vector.
     * If result is negative this vector must be rotated CW to match the direction of other vector
     */
    crossProduct(other: Vector2d): number {
        return ((this.i * other.j) - (this.j * other.i));
    }

}