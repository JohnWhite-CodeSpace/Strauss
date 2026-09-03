import { CircularLayout } from "../core/CircularLayout.js";
import { ForceDirectedLayout } from "../core/ForceDirectedLayout.js";


export class Renderer {
    constructor() {
        this.canvas = document.getElementById("graphCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.layout = "circular";
        this.circularLayout = new CircularLayout(this.width, this.height);
        this.forceLayout = null;
        this.forceNodeCount = null;
        this.forceTemperature = Math.min(this.width, this.height) / 10;
        this.updateThemeColors();
    }

// #######################################################################################################
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

// #######################################################################################################
    setLayout(layout) {
        const validLayouts = ["circular", "force"];

        if(!validLayouts.includes(layout)) {
            console.warn(`Unknown layout: ${layout}`);
            return;
        }

        this.layout = layout;
    }

// #######################################################################################################
    setForceTemperature(temperature) {
        if(!Number.isFinite(temperature) || temperature <= 0) {
            return;
        }

        this.forceTemperature = temperature;

        if(this.forceLayout) {
            this.forceLayout.setTemperature(temperature);
        }
    }

// #######################################################################################################
    getForceLayout(graph) {
        if(!this.forceLayout || this.forceNodeCount !== graph.nodeCount) {
            this.forceLayout = new ForceDirectedLayout(
                graph,
                this.width,
                this.height,
                this.forceTemperature
            );

            this.forceNodeCount = graph.nodeCount;
        }
        else{
            this.forceLayout.graph = graph;
        }

        return this.forceLayout;
    }

// #######################################################################################################
    updateLayout(graph) {
        if(this.layout !== "force") {
            return;
        }

        const forceLayout = this.getForceLayout(graph);
        forceLayout.step();
    }

// #######################################################################################################
    computeNodePositions(graph) {
        switch(this.layout) {
            case "circular":
                return this.circularLayout.compute(graph);

            case "force":
                return this.getForceLayout(graph).positions;

            default:
                return this.circularLayout.compute(graph);
        }
    }

// #######################################################################################################
    draw(graph) {
        this.updateThemeColors();
        this.clear();

        const positions = this.computeNodePositions(graph);

        this.drawEdges(graph, positions);
        this.drawNodes(positions);
    }

// #######################################################################################################
    drawNodes(positions) {
        for(const node of positions) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.nodeColor;
            this.ctx.fill();
        }
    }

// #######################################################################################################
    drawEdges(graph, positions) {
        for(let i = 0; i < graph.nodeCount; i++) {
            for(const j of graph.adjacency[i]) {
                if(j > i) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        positions[i].x,
                        positions[i].y
                    );
                    this.ctx.lineTo(
                        positions[j].x,
                        positions[j].y
                    );
                    this.ctx.strokeStyle = this.edgeColor;
                    this.ctx.stroke();
                }
            }
        }
    }

// #######################################################################################################
    resetLayout() {
        this.forceLayout = null;
        this.forceNodeCount = null;
    }

// #######################################################################################################
    updateThemeColors() {
        const style = getComputedStyle(document.documentElement);
        this.nodeColor = style.getPropertyValue("--graph-node-color");
        this.edgeColor = style.getPropertyValue("--graph-edge-color");
    }
}