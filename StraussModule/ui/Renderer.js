export class Renderer {

    constructor() {
        this.canvas =document.getElementById("graphCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.width= this.canvas.width;
        this.height = this.canvas.height;
        this.updateThemeColors();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    computeNodePositions(graph) {
        const positions = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius =
        Math.min(this.width, this.height) * 0.4;
        for (let i = 0; i < graph.nodeCount;i++) {
            const angle =(2 * Math.PI * i) /graph.nodeCount;
            const x =centerX + radius * Math.cos(angle);
            const y =centerY +radius * Math.sin(angle);
            positions.push({x,y});
        }

        return positions;
    }

    draw(graph){
        this.updateThemeColors();
        this.clear();
        const positions =this.computeNodePositions(graph);
        this.drawEdges(graph,positions);
        this.drawNodes(positions);
    }

    drawNodes(positions) {
        for (const node of positions) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y,5,0,2 * Math.PI);
            this.ctx.fillStyle =this.nodeColor;
            this.ctx.fill();
        }
    }

    drawEdges(graph, positions) {
        for (let i = 0; i < graph.nodeCount;i++) {
            for (const j of graph.adjacency[i]) {
                if (j > i) {   
                    this.ctx.beginPath();  
                    this.ctx.moveTo(  positions[i].x, positions[i].y);
                    this.ctx.lineTo(positions[j].x, positions[j].y);
                    this.ctx.strokeStyle = this.edgeColor;
                    this.ctx.stroke();
                }
            }
        }
    }

    updateThemeColors(){
        const style = getComputedStyle(document.documentElement);
        this.nodeColor =style.getPropertyValue("--graph-node-color");
        this.edgeColor = style.getPropertyValue("--graph-edge-color");
    }
}