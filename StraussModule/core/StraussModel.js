export class StraussModel {
    constructor(theta, sigma) {
        this.theta = theta;
        this.sigma = sigma;
    }

    computeDelta(graph,i,j){

        const edgeExists=graph.hasEdge(i,j);
        const deltaEdges=edgeExists ? -1 : 1;
        const commonNeighbors=graph.commonNeighbors(i,j);
        const deltaTriangles=edgeExists
            ? -commonNeighbors
            : commonNeighbors;

        const result=
            this.theta*deltaEdges+
            this.sigma*deltaTriangles;

        console.log(
            "edgeExists=",edgeExists,
            "deltaEdges=",deltaEdges,
            "commonNeighbors=",commonNeighbors,
            "deltaTriangles=",deltaTriangles,
            "theta=",this.theta,
            "sigma=",this.sigma,
            "result=",result
        );

        return result;
    }
    calculateEnergy(graph){
        const edges = graph.countEdges();
        const triangles = graph.countTriangles();
        return (this.theta * edges + this.sigma * triangles);
    }
}