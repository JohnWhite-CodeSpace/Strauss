export class MonteCarlo {

    constructor(graph, model, options = {}) {

        this.graph = graph;
        this.model = model;
        this.steps = 0;
        this.acceptedMoves = 0;
        this.logInterval = options.logInterval ?? 0;
        this.history = {energy: [], acceptance: [], triangles: [], states: [], density:[], equilibrium:[]};
    }

// #######################################################################################################
    acceptMove(deltaH) {
        if (deltaH >= 0) {
            return true;
        }
        const probability = Math.exp(deltaH);

        return Math.random() < probability;
    }

// #######################################################################################################
    saveSnapshot() {

        this.history.states.push({
            step: this.steps, 
            edges: this.graph.countEdges(),
            triangles: this.graph.countTriangles(),
            acceptedMoves: this.acceptedMoves,
            acceptanceRate: this.acceptedMoves / this.steps
        });
    }

// #######################################################################################################
    saveChartData() {

        const energy = this.model.calculateEnergy(this.graph);
        const triangles = this.graph.countTriangles();
        const acceptanceRate=this.steps>0? this.acceptedMoves/this.steps: 0;
        const maxEdges=this.graph.nodeCount*(this.graph.nodeCount-1)/2;
        const density=this.graph.countEdges()/maxEdges;
        const recent=this.history.energy.slice(-50);
        let variance=0;
        if(recent.length>10){
        const mean=recent.reduce((a,b)=>a+b.value,0)/recent.length;
        variance=recent.reduce((sum,p)=>sum+Math.pow(p.value-mean,2),0)/recent.length;}

        this.history.energy.push({step: this.steps, value: energy});
        this.history.acceptance.push({step: this.steps, value: acceptanceRate});
        this.history.triangles.push({step: this.steps,value: triangles});
        this.history.density.push({step:this.steps,value:density});
        this.history.equilibrium.push({step:this.steps, value:variance});
    }

// #######################################################################################################
    step() {
        const [i, j] = this.graph.getRandomPair();
        const deltaH = this.model.computeDelta(this.graph, i, j);
        const accepted = this.acceptMove(deltaH);
        if (accepted) {
            this.graph.toggleEdge(i,j);
            this.acceptedMoves++;
        }
        this.steps++;

        if (this.logInterval > 0 && this.steps % this.logInterval === 0) {
            this.saveSnapshot();
            this.saveChartData();
        }
        if(this.steps<20){
        console.log("deltaH:",deltaH,"edgeExists:",this.graph.hasEdge(i,j));
}
        return accepted;
    }

// #######################################################################################################
    run(numberOfSteps) {
        for (let i = 0; i < numberOfSteps; i++) {
            this.step();
        }
    }

// #######################################################################################################
    getHistory() {
        return this.history;
    }

// #######################################################################################################
    clearHistory() {
        this.history = {energy: [], acceptance: [], triangles: [], states: []};
    }

// #######################################################################################################
    getStats() {
        const maxEdges =this.graph.nodeCount * (this.graph.nodeCount - 1)/ 2;
        return {steps: this.steps,acceptedMoves: this.acceptedMoves,
            acceptanceRate: this.steps > 0? this.acceptedMoves / this.steps: 0,
            edges:this.graph.countEdges(),
            triangles:this.graph.countTriangles(),
            density:this.graph.countEdges()/maxEdges
        };
    }
}