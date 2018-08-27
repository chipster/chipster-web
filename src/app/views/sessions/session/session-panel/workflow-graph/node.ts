import { Job } from "chipster-js-common";

export default class Node {
    x: number;
    y: number;
    color: string;
    source: Node;
    target: Node;
    sourceJob: Job;
    created: string;
}
