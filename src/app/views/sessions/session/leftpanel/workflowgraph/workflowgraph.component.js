"use strict";
var utils_service_1 = require("../../../../services/utils.service");
var workflowgraph_service_1 = require("./workflowgraph.service.ts");
var changedetector_service_1 = require("../../../../services/changedetector.service");
var changedetector_service_2 = require("../../../../services/changedetector.service");
var changedetector_service_3 = require("../../../../services/changedetector.service");
var d3 = require("d3");
var d3Tip = require("d3-tip");
var d3ContextMenu = require("d3-context-menu");
var utils_service_2 = require("../../../../services/utils.service");
var WorkflowGraphController = (function () {
    function WorkflowGraphController($scope, $window, $log, $filter, SessionDataService, SelectionService, $element) {
        this.$scope = $scope;
        this.$window = $window;
        this.$log = $log;
        this.$filter = $filter;
        this.SessionDataService = SessionDataService;
        this.SelectionService = SelectionService;
        this.$element = $element;
        this.nodeWidth = workflowgraph_service_1.default.nodeWidth;
        this.nodeHeight = workflowgraph_service_1.default.nodeHeight;
        this.fontSize = 14;
        this.nodeRadius = 4;
        this.changeDetectors = [];
        var d3js = d3;
        d3js['tip'] = d3Tip;
        d3js['contextMenu'] = d3ContextMenu(d3);
    }
    WorkflowGraphController.prototype.$onInit = function () {
        var _this = this;
        this.zoomer = d3.behavior.zoom()
            .scaleExtent([0.2, 1])
            .scale(this.zoom)
            .on('zoom', this.zoomAndPan.bind(this));
        // used for adjusting the svg size
        this.svgContainer = this.getGraph().append('div').classed('fill', true).classed('workflowgraph-container', true);
        this.outerSvg = this.svgContainer.append('svg').call(this.zoomer);
        // draw background on outerSvg, so that it won't pan or zoom
        this.renderBackground(this.outerSvg);
        this.svg = this.outerSvg.append('g');
        this.updateSvgSize();
        this.transformView(0, 0, this.zoomer.scale());
        // order of these appends will determine the drawing order
        this.d3DatasetNodesGroup = this.svg.append('g').attr('class', 'dataset node');
        this.d3JobNodesGroup = this.svg.append('g').attr('class', 'job node');
        this.d3LinksGroup = this.svg.append('g').attr('class', 'link');
        this.d3LinksDefsGroup = this.d3LinksGroup.append('defs');
        this.d3LabelsGroup = this.svg.append('g').attr('class', 'label');
        this.createShadowFilter();
        // initialize the comparison of input collections
        // shallow comparison is enough for noticing when the array is changed
        this.changeDetectors.push(new changedetector_service_3.ArrayChangeDetector(function () { return _this.SelectionService.selectedDatasets; }, function () {
            _this.renderGraph();
        }, changedetector_service_1.Comparison.Shallow));
        this.changeDetectors.push(new changedetector_service_3.ArrayChangeDetector(function () { return _this.SelectionService.selectedJobs; }, function () {
            _this.renderGraph();
        }, changedetector_service_1.Comparison.Shallow));
        // deep comparison is needed to notice the changes in the objects (e.g. rename)
        this.changeDetectors.push(new changedetector_service_2.MapChangeDetector(function () { return _this.datasetsMap; }, function () {
            _this.update();
        }, changedetector_service_1.Comparison.Deep));
        this.changeDetectors.push(new changedetector_service_2.MapChangeDetector(function () { return _this.jobsMap; }, function () {
            _this.update();
        }, changedetector_service_1.Comparison.Deep));
        this.changeDetectors.push(new changedetector_service_2.MapChangeDetector(function () { return _this.modulesMap; }, function () {
            _this.update();
        }, changedetector_service_1.Comparison.Deep));
    };
    WorkflowGraphController.prototype.$onChanges = function (changes) {
        if (!this.svg) {
            // not yet initialized
            return;
        }
        if ("datasetSearch" in changes) {
            if (this.datasetSearch) {
                var filteredDatasets = this.$filter('searchDatasetFilter')(utils_service_1.default.mapValues(this.datasetsMap), this.datasetSearch);
                this.filter = utils_service_1.default.arrayToMap(filteredDatasets, 'datasetId');
            }
            else {
                this.filter = null;
            }
            this.renderGraph();
        }
    };
    WorkflowGraphController.prototype.$doCheck = function () {
        if (this.svg) {
            this.changeDetectors.forEach(function (cd) { return cd.check(); });
            // it seems that there is no easy way to listen for div's size changes
            // running this on every digest cycle might be close enough
            this.updateSvgSize();
        }
    };
    WorkflowGraphController.prototype.updateSvgSize = function () {
        // get the DOM element with [0][0] ( when there is only one element in the selection)
        var element = this.svgContainer[0][0];
        // leave some pixels for margins, otherwise the element will grow
        this.width = Math.max(200, element.offsetWidth);
        this.height = Math.max(200, element.offsetHeight - 5);
        this.outerSvg
            .attr('width', this.width)
            .attr('height', this.height);
        this.background
            .attr('width', this.width)
            .attr('height', this.height);
    };
    WorkflowGraphController.prototype.getGraph = function () {
        // why $element is an array?
        return d3.select(this.$element[0]);
    };
    WorkflowGraphController.prototype.update = function () {
        var datasetNodes = this.getDatasetNodes(this.datasetsMap, this.jobsMap, this.modulesMap);
        var jobNodes = this.getJobNodes(this.jobsMap);
        // Add datasets before jobs, because the layout will be done in this order.
        // Jobs should make space for the datasets in the layout, because
        // the jobs are only temporary.
        var allNodes = datasetNodes.concat(jobNodes);
        var links = this.getLinks(allNodes);
        this.doLayout(links, allNodes);
        this.datasetNodes = datasetNodes;
        this.jobNodes = jobNodes;
        this.links = links;
        this.renderGraph();
    };
    WorkflowGraphController.prototype.renderJobs = function () {
        var _this = this;
        var arc = d3.svg.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);
        var self = this;
        this.d3JobNodes = this.d3JobNodesGroup.selectAll('rect').data(this.jobNodes);
        // create the new job nodes and throw away the selection of created nodes
        this.d3JobNodes.enter().append('rect');
        this.d3JobNodes.exit().remove();
        // update all job nodes
        this.d3JobNodes
            .attr('rx', this.nodeRadius)
            .attr('ry', this.nodeRadius)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
            .style('fill', function (d) { return d.color; })
            .attr('opacity', function () { return WorkflowGraphController.getOpacity(!_this.filter); })
            .classed('selected', function (d) { return self.enabled && self.isSelectedJob(d.job); })
            .on('click', function (d) {
            if (!_this.enabled) {
                return;
            }
            _this.$scope.$apply(_this.SelectionService.selectJob(d3.event, d.job));
        })
            .on('mouseover', function () {
            d3.select(this).style('filter', 'url(#drop-shadow)');
        })
            .on('mouseout', function () {
            d3.select(this).style('filter', null);
        });
        // create an arc for each job
        this.d3JobNodesGroup.selectAll('path').data(this.jobNodes).enter().append('path')
            .style('fill', function (d) { return d.fgColor; })
            .style('stroke-width', 0)
            .attr('opacity', this.filter ? 0.1 : 0.5)
            .style('pointer-events', 'none')
            .attr('d', arc)
            .call(this.spin.bind(this), 3000);
    };
    WorkflowGraphController.prototype.isSelectedJob = function (job) {
        return this.SelectionService.selectedJobs.indexOf(job) != -1;
    };
    WorkflowGraphController.prototype.isSelectedDataset = function (dataset) {
        return this.SelectionService.selectedDatasets.indexOf(dataset) != -1;
    };
    WorkflowGraphController.prototype.showDefaultVisualization = function () {
        this.$scope.$broadcast('showDefaultVisualization', {});
    };
    WorkflowGraphController.prototype.spin = function (selection, duration) {
        var _this = this;
        // first round
        selection
            .transition()
            .ease('linear')
            .duration(duration)
            .attrTween('transform', function (d) {
            var x = d.x + _this.nodeWidth / 2;
            var y = d.y + _this.nodeHeight / 2;
            if (d.spin) {
                return d3.interpolateString('translate(' + x + ',' + y + ')rotate(0)', 'translate(' + x + ',' + y + ')rotate(360)');
            }
            else {
                return d3.interpolateString('translate(' + x + ',' + y + ')', 'translate(' + x + ',' + y + ')');
            }
        });
        // schedule the next round
        setTimeout(function () {
            _this.spin(selection, duration);
        }, duration);
    };
    WorkflowGraphController.prototype.renderBackground = function (parent) {
        var _this = this;
        // invisible rect for listening background clicks
        this.background = parent.append('g').attr('class', 'background').append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('opacity', 0)
            .on('click', function () {
            if (_this.enabled) {
                _this.$scope.$apply(_this.SelectionService.clearSelection());
            }
        });
    };
    WorkflowGraphController.prototype.renderDatasets = function () {
        var _this = this;
        var tip = d3['tip']()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) { return d.name; });
        this.svg.call(tip);
        var self = this;
        // store the selection of all existing and new elements
        this.d3DatasetNodes = this.d3DatasetNodesGroup.selectAll('rect').data(this.datasetNodes);
        // don't store this selection, because enter() returns only the new elements
        this.d3DatasetNodes.enter().append('rect');
        // remove deleted nodes
        // for some reason the effect is visible only when removing multiple datasets twice
        this.d3DatasetNodes.exit().remove();
        // apply to all elements (old and new)
        this.d3DatasetNodes
            .attr('x', function (d) { return d.x; })
            .attr('y', function (d) { return d.y; })
            .attr('rx', this.nodeRadius)
            .attr('ry', this.nodeRadius)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .style("fill", function (d) { return d.color; })
            .attr('opacity', function (d) { return _this.getOpacityForDataset(d.dataset); })
            .classed('selected', function (d) { return _this.enabled && _this.isSelectedDataset(d.dataset); })
            .on('dblclick', function () {
            if (!_this.enabled) {
                return;
            }
            _this.showDefaultVisualization();
        })
            .on('click', function (d) {
            if (!_this.enabled) {
                return;
            }
            _this.$scope.$apply(function () {
                if (!utils_service_1.default.isCtrlKey(d3.event)) {
                    _this.SelectionService.clearSelection();
                }
                _this.SelectionService.toggleDatasetSelection(d3.event, d.dataset, utils_service_2.default.mapValues(_this.datasetsMap));
            });
            tip.hide(d);
        })
            .call(d3.behavior.drag()
            .on('drag', function () {
            var event = d3.event;
            if (!_this.enabled) {
                return;
            }
            _this.dragStarted = true;
            _this.dragNodes(event.dx, event.dy);
            // set defaultPrevented flag to disable scrolling
            event.sourceEvent.preventDefault();
        })
            .on('dragend', function () {
            // check the flag to differentiate between drag and click events
            if (_this.dragStarted) {
                _this.dragStarted = false;
                _this.dragEnd();
            }
        }))
            .on('contextmenu', d3['contextMenu'](this.menu).bind(this))
            .on('mouseover', function (d) {
            if (!self.enabled) {
                return;
            }
            // how to get the current element without select(this) so that we can bind(this)
            // and get rid of 'self'
            d3.select(this).style('filter', 'url(#drop-shadow)');
            tip.show(d);
        })
            .on('mouseout', function (d) {
            if (!self.enabled) {
                return;
            }
            d3.select(this).style('filter', null);
            tip.hide(d);
        });
    };
    WorkflowGraphController.prototype.getOpacityForDataset = function (d) {
        return WorkflowGraphController.getOpacity(!this.filter || this.filter.has(d.datasetId));
    };
    WorkflowGraphController.getOpacity = function (isVisible) {
        if (isVisible) {
            return 1.0;
        }
        else {
            return 0.25;
        }
    };
    WorkflowGraphController.prototype.renderLabels = function () {
        var _this = this;
        this.d3Labels = this.d3LabelsGroup.selectAll('text').data(this.datasetNodes);
        this.d3Labels.enter().append('text');
        this.d3Labels.exit().remove();
        this.d3Labels.text(function (d) { return utils_service_1.default.getFileExtension(d.name).slice(0, 4); })
            .attr('x', function (d) { return d.x + _this.nodeWidth / 2; })
            .attr('y', function (d) { return d.y + _this.nodeHeight / 2 + _this.fontSize / 4; })
            .attr('font-size', this.fontSize + 'px').attr('fill', 'black').attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .attr('opacity', function (d) { return _this.getOpacityForDataset(d.dataset); });
    };
    WorkflowGraphController.prototype.renderLinks = function () {
        var _this = this;
        //building the arrows for the link end
        this.d3LinksDefsGroup.selectAll('marker').data(['end']).enter().append('marker')
            .attr('id', String)
            .attr('viewBox', '-7 -7 14 14')
            .attr('refX', 6)
            .attr('refY', 0)
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .attr('orient', 'auto')
            .append('path').attr('d', 'M 0,0 m -7,-7 L 7,0 L -7,7 Z')
            .style('fill', '#555');
        //Define the xy positions of the link
        this.d3Links = this.d3LinksGroup.selectAll('line').data(this.links);
        // add new lines, but throw away the "enter" selection
        this.d3Links.enter().append('line');
        this.d3Links.exit().remove();
        // update also the old lines (for example when dragging dataset)
        this.d3Links
            .attr('x1', function (d) { return d.source.x + _this.nodeWidth / 2; })
            .attr('y1', function (d) { return d.source.y + _this.nodeHeight; })
            .attr('x2', function (d) { return d.target.x + _this.nodeWidth / 2; })
            .attr('y2', function (d) { return d.target.y; })
            .attr('opacity', function () { return WorkflowGraphController.getOpacity(!_this.filter); })
            .style('marker-end', 'url(#end)');
    };
    //Function to describe drag behavior
    WorkflowGraphController.prototype.dragNodes = function (dx, dy) {
        var _this = this;
        this.d3DatasetNodes
            .filter(function (d) { return _this.isSelectedDataset(d.dataset); })
            .attr('x', function (d) { return d.x += dx; })
            .attr('y', function (d) { return d.y += dy; });
        this.d3Labels
            .filter(function (d) { return _this.isSelectedDataset(d.dataset); })
            .attr('x', function (d) { return d.x + dx + _this.nodeWidth / 2; })
            .attr('y', function (d) { return d.y + dy + _this.nodeHeight / 2 + _this.fontSize / 4; });
        this.d3Links
            .filter(function (d) { return _this.isSelectedDataset(d.source.dataset); })
            .attr('x1', function (d) { return d.source.x + _this.nodeWidth / 2; })
            .attr('y1', function (d) { return d.source.y + _this.nodeHeight; });
        this.d3Links
            .filter(function (d) { return _this.isSelectedDataset(d.target.dataset); })
            .attr('x2', function (d) { return d.target.x + _this.nodeWidth / 2; })
            .attr('y2', function (d) { return d.target.y; });
    };
    WorkflowGraphController.prototype.dragEnd = function () {
        var _this = this;
        // update positions of all selected datasets to the server
        this.d3DatasetNodes
            .filter(function (d) { return _this.isSelectedDataset(d.dataset); })
            .each(function (d) {
            if (d.dataset) {
                d.dataset.x = d.x;
                d.dataset.y = d.y;
                _this.SessionDataService.updateDataset(d.dataset);
            }
        });
    };
    WorkflowGraphController.prototype.defineRightClickMenu = function () {
        var _this = this;
        this.menu = [{ title: 'Visualize', action: function () {
                    _this.showDefaultVisualization();
                } },
            { title: 'Rename', action: function (elm, d) {
                    this.SessionDataService.renameDatasetDialog(d.dataset);
                } },
            { title: 'Delete', action: function () {
                    _this.onDelete();
                } },
            { title: 'Export', action: function () {
                    _this.SessionDataService.exportDatasets(_this.SelectionService.selectedDatasets);
                } },
            { title: 'View History as text', action: function () {
                    _this.SessionDataService.openDatasetHistoryModal();
                } }
        ];
    };
    WorkflowGraphController.prototype.renderGraph = function () {
        if (!this.datasetNodes || !this.jobNodes || !this.links) {
            this.update();
        }
        //Rendering the graph elements
        if (this.enabled) {
            this.defineRightClickMenu();
        }
        this.renderLinks();
        this.renderDatasets();
        this.renderLabels();
        this.renderJobs();
        /*
        function keydown() {
            shiftKey = d3.event.shiftKey
                || d3.event.metaKey;
            ctrlKey = d3.event.ctrlKey;

            if (d3.event.keyCode == 67) {
                //the c key
            }

            if (shiftKey) {
                svg_graph.call(zoomer).on('mousedown.zoom', null).on('touchstart.zoom', null)
                    .on('touchmove.zoom', null).on('touchend.zoom', null);

                vis.selectAll('g.gnode').on('mousedown.drag', null);
            }
        }

        function keyup() {
            shiftKey = d3.event.shiftKey
                || d3.event.metaKey;
            ctrlKey = d3.event.ctrlKey;
            svg_graph.call(zoomer);
        }
        */
    };
    WorkflowGraphController.prototype.zoomAndPan = function () {
        var event = d3.event;
        // allow default zoom level to be set even when disabled
        if (!this.enabled && event.scale !== this.zoom) {
            return;
        }
        // let zoom events go through, because those have always defaultPrevented === true
        if (event.scale === this.lastScale) {
            // disable scrolling when dragging nodes
            if (event.sourceEvent && event.sourceEvent.defaultPrevented) {
                return;
            }
        }
        this.lastScale = event.scale;
        // prevent scrolling over the top and left edges
        var tx = Math.min(0, event.translate[0]);
        var ty = Math.min(0, event.translate[1]);
        /*
        Set limited values as a starting point of the new events.
        Otherwise the coordinates keep growing when you scroll over the
        limits and you have to scroll back before anything happens.
        */
        this.zoomer.translate([tx, ty]);
        this.transformView(tx, ty, event.scale);
    };
    WorkflowGraphController.prototype.transformView = function (tx, ty, scale) {
        this.svg.attr('transform', 'translate('
            + [tx, ty] + ')'
            + 'scale(' + scale + ')');
    };
    WorkflowGraphController.prototype.createShadowFilter = function () {
        // hover shadows inspired bys
        // http://bl.ocks.org/cpbotha/5200394
        // create filter with id #drop-shadow
        // height=130% so that the shadow is not clipped
        var filter = this.svg.append("defs").append("filter")
            .attr("id", "drop-shadow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("height", "200%")
            .attr("width", "200%");
        // SourceAlpha refers to opacity of graphic that this filter will be applied to
        // convolve that with a Gaussian with standard deviation 3 and store result
        // in blur
        filter.append("feGaussianBlur")
            .attr("in", "SourceGraphic")
            .attr("stdDeviation", 3)
            .attr("result", "blur");
        // translate output of Gaussian blur to the right and downwards with 2px
        // store result in offsetBlur
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("result", "offsetBlur");
        // overlay original SourceGraphic over translated blurred opacity by using
        // feMerge filter. Order of specifying inputs is important!
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "offsetBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    };
    WorkflowGraphController.prototype.getDatasetNodes = function (datasetsMap, jobsMap, modulesMap) {
        var datasetNodes = [];
        datasetsMap.forEach(function (dataset) {
            var color = 'gray';
            if (dataset.sourceJob) {
                if (jobsMap.has(dataset.sourceJob)) {
                    var sourceJob = jobsMap.get(dataset.sourceJob);
                    var module = modulesMap.get(sourceJob.module);
                    if (module) {
                        var category = module.categoriesMap.get(sourceJob.toolCategory);
                        if (category) {
                            color = category.color;
                        }
                    }
                }
                else {
                    console.log('source job of dataset ' + dataset.name + ' not found');
                }
            }
            // when opening a session file, datasets may be without names for some time
            var name = dataset.name ? dataset.name : '';
            datasetNodes.push({
                x: dataset.x,
                y: dataset.y,
                name: name,
                extension: utils_service_1.default.getFileExtension(name),
                sourceJob: sourceJob,
                color: color,
                dataset: dataset
            });
        });
        return datasetNodes;
    };
    WorkflowGraphController.prototype.getJobNodes = function (jobsMap) {
        var jobNodes = [];
        jobsMap.forEach(function (job) {
            // no need to show completed jobs
            if (job.state !== 'COMPLETED') {
                var fgColor = '#4d4ddd';
                var color = 'lightGray';
                var spin = true;
                if (job.state === 'FAILED') {
                    color = 'yellow';
                    spin = false;
                }
                if (job.state === 'ERROR') {
                    color = 'red';
                    spin = false;
                }
                jobNodes.push({
                    x: null,
                    y: null,
                    fgColor: fgColor,
                    color: color,
                    spin: spin,
                    job: job,
                    sourceJob: job // to create links
                });
            }
        });
        return jobNodes;
    };
    WorkflowGraphController.prototype.getLinks = function (nodes) {
        var links = [];
        // map for searching source
        var datasetNodesMap = new Map();
        nodes.forEach(function (node) {
            if (node.dataset) {
                datasetNodesMap.set(node.dataset.datasetId, node);
            }
        });
        nodes.forEach(function (targetNode) {
            if (targetNode.sourceJob) {
                var sourceJob = targetNode.sourceJob;
                // iterate over the inputs of the source job
                sourceJob.inputs.forEach(function (input) {
                    var sourceNode = datasetNodesMap.get(input.datasetId);
                    if (sourceNode && targetNode) {
                        links.push({
                            source: sourceNode,
                            target: targetNode
                        });
                    }
                });
            }
        });
        return links;
    };
    WorkflowGraphController.prototype.doLayout = function (links, nodes) {
        // layout nodes that don't yet have a position
        // layout nodes with parents (assumes that a parent precedes its childrens in the array)
        links.forEach(function (link) {
            if (!link.target.x || !link.target.y) {
                var pos = workflowgraph_service_1.default.newPosition(nodes, link.source.x, link.source.y);
                link.target.x = pos.x;
                link.target.y = pos.y;
            }
        });
        // layout orphan nodes
        nodes.forEach(function (node) {
            if (!node.x || !node.y) {
                var pos = workflowgraph_service_1.default.newRootPosition(nodes);
                node.x = pos.x;
                node.y = pos.y;
            }
        });
    };
    return WorkflowGraphController;
}());
WorkflowGraphController.$inject = ['$scope', '$window', '$log', '$filter', 'SessionDataService', 'SelectionService', '$element'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: WorkflowGraphController,
    bindings: {
        datasetsMap: '<',
        jobsMap: '<',
        modulesMap: '<',
        datasetSearch: '<',
        onDelete: '&',
        zoom: '<',
        enabled: '<'
    }
};
//# sourceMappingURL=workflowgraph.component.js.map
