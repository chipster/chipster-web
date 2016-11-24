import Job from "../../../../../model/session/job";
import Node from './node';

export interface JobNode extends Node {
  job: Job;
  fgColor: string;
  spin: boolean;
}
