import Job from "../model/job";

export default class Node {
    x: number;
    y: number;
    color: string;
    source: Node;
    target: Node;
    sourceJob: Job;
}