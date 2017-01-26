export type Resource =
    'DATASET' |
    'JOB' |
    'SESSION' |
    'AUTHORIZATION';

export type EventType =
    'CREATE' |
    'UPDATE' |
    'DELETE';

export default class WsEvent {

  constructor(
    public sessionId: string,
    public resourceType: Resource,
    public resourceId: string,
    public type: EventType
  ) {
  }

  serverId: string;
  eventNumber: number;
}
