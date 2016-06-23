class Point {

    constructor() {}

    x: number = 10;
    y: number = 20;

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }
}

export default () => new Point();

