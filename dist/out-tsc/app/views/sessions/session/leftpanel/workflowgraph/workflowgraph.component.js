var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SelectionService from "../../selection.service";
import { Component, Input } from "@angular/core";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import UtilsService from "../../../../../shared/utilities/utils";
import SessionDataService from "../../sessiondata.service";
import * as d3 from "d3";
import WorkflowGraphService from "./workflowgraph.service";
import SessionEventService from "../../sessionevent.service";
import * as _ from "lodash";
export var WorkflowGraphComponent = (function () {
    function WorkflowGraphComponent(sessionDataService, sessionEventService, SelectionService, pipeService, workflowGraphService) {
        this.sessionDataService = sessionDataService;
        this.sessionEventService = sessionEventService;
        this.SelectionService = SelectionService;
        this.pipeService = pipeService;
        this.workflowGraphService = workflowGraphService;
        this.nodeWidth = this.workflowGraphService.nodeWidth;
        this.nodeHeight = this.workflowGraphService.nodeHeight;
        this.fontSize = 14;
        this.nodeRadius = 4;
    }
    WorkflowGraphComponent.prototype.ngOnInit = function () {
        var _this = this;
        var self = this;
        // used for adjusting the svg size
        this.svgContainer = d3.select('#workflowvisualization').append('div').classed('fill', true).classed('workflow-container', true);
        this.outerSvg = this.svgContainer.append('svg');
        // draw background on outerSvg, so that it won't pan or zoom
        // invisible rect for listening background clicks
        this.background = this.outerSvg.append('g')
            .attr('class', 'background')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('opacity', 0)
            .on('click', function () {
            self.SelectionService.clearSelection();
        });
        this.svg = this.outerSvg.append('g');
        // order of these appends will determine the drawing order
        this.d3JobNodesGroup = this.svg.append('g').attr('class', 'job node').attr('id', 'd3JobNodesGroup');
        this.d3LinksGroup = this.svg.append('g').attr('class', 'link').attr('id', 'd3LinksGroup');
        this.d3LinksDefsGroup = this.d3LinksGroup.append('defs');
        this.d3DatasetNodesGroup = this.svg.append('g').attr('class', 'dataset node').attr('id', 'd3DatasetNodesGroup');
        this.d3LabelsGroup = this.svg.append('g').attr('class', 'label');
        if (this.enabled) {
            this.zoom = d3.zoom()
                .scaleExtent([0.2, 1])
                .on('zoom', function () {
                _this.svg.attr("transform", d3.event.transform);
            });
            d3.select('g.background').call(this.zoom);
        }
        else {
            this.svg.attr('transform', 'translate(0,0) scale(' + this.defaultScale + ')');
        }
        // apply zoom
        if (this.enabled) {
            this.sessionEventService.getDatasetStream().subscribe(function () {
                _this.update();
                _this.renderGraph();
            });
            this.sessionEventService.getJobStream().subscribe(function () {
                _this.update();
                _this.renderGraph();
            });
            this.SelectionService.getDatasetSelectionStream().subscribe(function () {
                _this.update();
                _this.renderGraph();
            });
            this.SelectionService.getJobSelectionStream().subscribe(function () {
                _this.update();
                _this.renderGraph();
            });
        }
        // show
        this.update();
        this.renderGraph();
        this.setSVGSize();
    };
    WorkflowGraphComponent.prototype.ngOnChanges = function (changes) {
        if (!this.svg) {
            // not yet initialized
            return;
        }
        if ("datasetSearch" in changes) {
            if (this.datasetSearch) {
                var filteredDatasets = this.pipeService.findDataset(UtilsService.mapValues(this.datasetsMap), this.datasetSearch);
                this.filter = UtilsService.arrayToMap(filteredDatasets, 'datasetId');
            }
            else {
                this.filter = null;
            }
            this.renderGraph();
        }
    };
    WorkflowGraphComponent.prototype.setSVGSize = function () {
        var jobNodesRect = document.getElementById('d3JobNodesGroup').getBoundingClientRect();
        var linksRect = document.getElementById('d3LinksGroup').getBoundingClientRect();
        var datasetNodesRect = document.getElementById('d3DatasetNodesGroup').getBoundingClientRect();
        var parent = document.getElementById('workflowvisualization').getBoundingClientRect();
        // have to calculate from the absolute coordinates (right, bottom etc.),
        // because bounding rect's width and height don't start the from the origo
        var contentWidth = _.max([jobNodesRect.right, linksRect.right, datasetNodesRect.right]) - parent.left;
        var contentHeight = _.max([jobNodesRect.bottom, linksRect.bottom, datasetNodesRect.bottom]) - parent.top;
        // svg should fill the parent. It's only a viewport, so the content or zoomming doesn't change it's size
        this.outerSvg.attr('width', parent.width).attr('height', parent.height);
        this.background.attr('width', parent.width).attr('height', parent.height);
        // This sets limits for the scrolling.
        // It must be large enough to accommodate all the content, but let it still
        // fill the whole viewport if the content is smaller than the viewport.
        // Otherwise d3 centers the content.
        var translateWidth = _.max([contentWidth, parent.width]);
        var translateHeight = _.max([contentHeight, parent.height]);
        if (this.zoom) {
            this.zoom.translateExtent([[0, 0], [translateWidth, translateHeight]]);
        }
    };
    WorkflowGraphComponent.prototype.update = function () {
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
    };
    WorkflowGraphComponent.prototype.renderJobs = function () {
        var _this = this;
        var arc = d3.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);
        this.d3JobNodes = this.d3JobNodesGroup.selectAll('rect').data(this.jobNodes);
        var self = this;
        this.d3JobNodes.enter().append('rect').merge(this.d3JobNodes)
            .attr('rx', this.nodeRadius)
            .attr('ry', this.nodeRadius)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
            .style('fill', function (d) { return d.color; })
            .style('opacity', function (d) { return WorkflowGraphComponent.getOpacity(!_this.filter); })
            .classed('selected-job', function (d) { return _this.isSelectedJob(d.job); })
            .on('click', function (d) {
            if (_this.enabled) {
                _this.SelectionService.selectJob(d3.event, d.job);
            }
        })
            .on('mouseover', function () {
            if (self.enabled) {
                d3.select(this).classed('hovering-job', true);
            }
        })
            .on('mouseout', function () {
            if (self.enabled) {
                d3.select(this).classed('hovering-job', false);
            }
        });
        this.d3JobNodes.exit().remove();
        // create an arc for each job
        var d3JobArcs = this.d3JobNodesGroup.selectAll('path').data(this.jobNodes);
        d3JobArcs.enter().append('path').merge(d3JobArcs)
            .style('fill', function (d) { return d.fgColor; })
            .style('stroke-width', 0)
            .attr('opacity', this.filter ? 0.1 : 0.5)
            .style('pointer-events', 'none')
            .attr('d', arc)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attrTween('transform', function (d) {
            var x = d.x + _this.nodeWidth / 2;
            var y = d.y + _this.nodeHeight / 2;
            return d.spin ? d3.interpolateString("translate(" + x + "," + y + ")rotate(0)", "translate(" + x + "," + y + ")rotate(360)") : d3.interpolateString("translate(" + x + "," + y + ")", "translate(" + x + "," + y + ")");
        });
        d3JobArcs.exit().remove();
    };
    WorkflowGraphComponent.prototype.isSelectedJob = function (job) {
        return this.SelectionService.selectedJobs.indexOf(job) != -1;
    };
    WorkflowGraphComponent.prototype.isSelectedDataset = function (dataset) {
        return this.SelectionService.selectedDatasets.indexOf(dataset) != -1;
    };
    WorkflowGraphComponent.prototype.renderDatasets = function () {
        var _this = this;
        var self = this;
        // store the selection of all existing and new elements
        this.d3DatasetNodes = this.d3DatasetNodesGroup.selectAll('rect')
            .data(this.datasetNodes, function (d) { return d.datasetId; });
        // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
        this.d3DatasetNodes.enter().append('rect').merge(this.d3DatasetNodes)
            .attr('x', function (d) { return d.x; })
            .attr('y', function (d) { return d.y; })
            .attr('rx', this.nodeRadius)
            .attr('ry', this.nodeRadius)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .style("fill", function (d) { return d.color; })
            .style('opacity', function (d) { return WorkflowGraphComponent.getOpacity(!_this.filter || _this.filter.has(d.datasetId)); })
            .classed('selected-dataset', function (d) { return _this.enabled && _this.isSelectedDataset(d.dataset); })
            .on('click', function (d) {
            if (self.enabled) {
                if (!UtilsService.isCtrlKey(d3.event)) {
                    self.SelectionService.clearSelection();
                }
                self.SelectionService.toggleDatasetSelection(d3.event, d.dataset, UtilsService.mapValues(self.datasetsMap));
            }
        })
            .on('mouseover', function () {
            if (self.enabled) {
                d3.select(this).classed('hovering-dataset', true);
            }
        })
            .on('mouseout', function () {
            if (self.enabled) {
                d3.select(this).classed('hovering-dataset', false);
            }
        })
            .call(d3.drag()
            .on('drag', function () {
            self.dragStarted = true;
            self.dragNodes(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
            // set defaultPrevented flag to disable scrolling
        })
            .on('end', function () {
            // check the flag to differentiate between drag and click events
            if (_this.dragStarted) {
                _this.dragStarted = false;
                _this.dragEnd();
            }
        }));
        this.d3DatasetNodes.exit().remove();
    };
    WorkflowGraphComponent.getOpacity = function (isVisible) {
        if (isVisible) {
            return 1.0;
        }
        else {
            return 0.25;
        }
    };
    WorkflowGraphComponent.prototype.renderLabels = function () {
        var _this = this;
        this.d3Labels = this.d3LabelsGroup.selectAll('text')
            .data(this.datasetNodes, function (d) { return d.datasetId; });
        this.d3Labels.enter().append('text').merge(this.d3Labels)
            .text(function (d) { return UtilsService.getFileExtension(d.name).slice(0, 4); })
            .attr('x', function (d) { return d.x + _this.nodeWidth / 2; })
            .attr('y', function (d) { return d.y + _this.nodeHeight / 2 + _this.fontSize / 4; })
            .attr('font-size', this.fontSize + 'px').attr('fill', 'black').attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('opacity', function (d) { return WorkflowGraphComponent.getOpacity(!_this.filter || _this.filter.has(d.datasetId)); });
        this.d3Labels.exit().remove();
    };
    //Function to describe drag behavior
    WorkflowGraphComponent.prototype.dragNodes = function (x, dx, y, dy) {
        var _this = this;
        this.d3DatasetNodes
            .filter(function (d) { return _this.isSelectedDataset(d.dataset); })
            .attr('x', function (d) { return d.x += dx; })
            .attr('y', function (d) { return d.y += dy; });
        this.d3Labels
            .filter(function (d) { return _this.isSelectedDataset(d.dataset); })
            .attr('x', function (d) { return d.x + _this.nodeWidth / 2; })
            .attr('y', function (d) { return d.y + _this.nodeHeight / 2 + _this.fontSize / 4; });
        this.d3Links
            .filter(function (d) { return _this.isSelectedDataset(d.source.dataset); })
            .attr('x1', function (d) { return d.source.x + _this.nodeWidth / 2; })
            .attr('y1', function (d) { return d.source.y + _this.nodeHeight; });
        this.d3Links
            .filter(function (d) { return _this.isSelectedDataset(d.target.dataset); })
            .attr('x2', function (d) { return d.target.x + _this.nodeWidth / 2; })
            .attr('y2', function (d) { return d.target.y; });
    };
    WorkflowGraphComponent.prototype.renderLinks = function () {
        var _this = this;
        var self = this;
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
        this.d3Links.enter().append('line').merge(this.d3Links)
            .attr('x1', function (d) { return d.source.x + _this.nodeWidth / 2; })
            .attr('y1', function (d) { return d.source.y + _this.nodeHeight; })
            .attr('x2', function (d) { return d.target.x + _this.nodeWidth / 2; })
            .attr('y2', function (d) { return d.target.y; })
            .on('click', function (d) {
            self.SelectionService.selectJob(d3.event, d.target.sourceJob);
        })
            .on('mouseover', function () {
            if (this.enabled) {
                d3.select(this).classed('hovering-job', true);
            }
        })
            .on('mouseout', function () {
            if (this.enabled) {
                d3.select(this).classed('hovering-job', false);
            }
        })
            .style('marker-end', 'url(#end)');
        this.d3Links.exit().remove();
    };
    WorkflowGraphComponent.prototype.dragEnd = function () {
        var _this = this;
        // update positions of all selected datasets to the server
        this.d3DatasetNodes
            .filter(function (d) {
            return _this.isSelectedDataset(d.dataset);
        })
            .each(function (d) {
            if (d.dataset) {
                d.dataset.x = d.x;
                d.dataset.y = d.y;
                _this.sessionDataService.updateDataset(d.dataset);
            }
        });
    };
    WorkflowGraphComponent.prototype.renderGraph = function () {
        this.renderLinks();
        this.renderJobs();
        this.renderDatasets();
        this.renderLabels();
    };
    WorkflowGraphComponent.prototype.getDatasetNodes = function (datasetsMap, jobsMap, modulesMap) {
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
                }
            }
            // when opening a session file, datasets may be without names for some time
            var name = dataset.name ? dataset.name : '';
            datasetNodes.push({
                x: dataset.x,
                y: dataset.y,
                name: name,
                extension: UtilsService.getFileExtension(name),
                source: null,
                target: null,
                sourceJob: sourceJob,
                color: color,
                dataset: dataset,
                datasetId: dataset.datasetId
            });
        });
        return datasetNodes;
    };
    WorkflowGraphComponent.prototype.getJobNodes = function (jobsMap) {
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
                    sourceJob: job,
                });
            }
        });
        return jobNodes;
    };
    WorkflowGraphComponent.prototype.spin = function (selection, duration) {
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
    WorkflowGraphComponent.prototype.getLinks = function (nodes) {
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
    WorkflowGraphComponent.prototype.doLayout = function (links, nodes) {
        // layout nodes that don't yet have a position
        var _this = this;
        // layout nodes with parents (assumes that a parent precedes its childrens in the array)
        links.forEach(function (link) {
            if (!link.target.x || !link.target.y) {
                var pos = _this.workflowGraphService.newPosition(nodes, link.source.x, link.source.y);
                link.target.x = pos.x;
                link.target.y = pos.y;
            }
        });
        // layout orphan nodes
        nodes.forEach(function (node) {
            if (!node.x || !node.y) {
                var pos = _this.workflowGraphService.newRootPosition(nodes);
                node.x = pos.x;
                node.y = pos.y;
            }
        });
    };
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], WorkflowGraphComponent.prototype, "datasetsMap", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], WorkflowGraphComponent.prototype, "jobsMap", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], WorkflowGraphComponent.prototype, "modulesMap", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], WorkflowGraphComponent.prototype, "datasetSearch", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Number)
    ], WorkflowGraphComponent.prototype, "defaultScale", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Boolean)
    ], WorkflowGraphComponent.prototype, "enabled", void 0);
    WorkflowGraphComponent = __decorate([
        Component({
            selector: 'ch-workflow-graph',
            template: '<section id="workflowvisualization"></section>'
        }), 
        __metadata('design:paramtypes', [SessionDataService, SessionEventService, SelectionService, PipeService, WorkflowGraphService])
    ], WorkflowGraphComponent);
    return WorkflowGraphComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.component.js.map