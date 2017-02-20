var WsEvent = (function () {
    function WsEvent(sessionId, resourceType, resourceId, type) {
        this.sessionId = sessionId;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.type = type;
    }
    return WsEvent;
}());
export default WsEvent;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/events/wsevent.js.map