var VennCircle = (function () {
    function VennCircle(datasetId, filename, data, circle) {
        this.datasetId = datasetId;
        this.filename = filename;
        this.data = data;
        this.circle = circle;
        datasetId;
        filename;
        data; // array of tuples containing symbol and identifier (both of which are nullable)
        circle;
    }
    return VennCircle;
}());
export default VennCircle;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/venncircle.js.map