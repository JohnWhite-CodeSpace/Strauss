export class Graph {

    constructor(nodeCount) {
        this.nodeCount = nodeCount;
        this.adjacency = Array.from({ length: nodeCount }, () => new Set());
        this.edgeCount = 0;
        this.triangleCount = 0;
        this.degrees = new Uint32Array(nodeCount);
    }

    hasEdge(i, j) {
        return this.adjacency[i].has(j);
    }

    addEdge(i, j) {
        if (i === j || this.hasEdge(i, j)) return false;
        const deltaTriangles = this.commonNeighbors(i, j);
        this.adjacency[i].add(j);
        this.adjacency[j].add(i);
        this.edgeCount++;
        this.triangleCount += deltaTriangles;
        this.degrees[i]++;
        this.degrees[j]++;

        return true;
    }

    removeEdge(i, j) {
        if (!this.hasEdge(i, j)) return false;
        const deltaTriangles = this.commonNeighbors(i, j);
        this.adjacency[i].delete(j);
        this.adjacency[j].delete(i);
        this.edgeCount--;
        this.triangleCount -= deltaTriangles;
        this.degrees[i]--;
        this.degrees[j]--;

        return true;
    }

    toggleEdge(i, j) {
        if (this.hasEdge(i, j)) {
            return this.removeEdge(i, j);
        }

        return this.addEdge(i, j);
    }

    degree(i) {
        return this.degrees[i];
    }

    countEdges() {
        return this.edgeCount;
    }

    countTriangles() {
        return this.triangleCount;
    }

    commonNeighbors(i, j) {
        let count = 0;
        const smaller = this.degrees[i] < this.degrees[j] ? this.adjacency[i] : this.adjacency[j];
        const larger = smaller === this.adjacency[i] ? this.adjacency[j] : this.adjacency[i];

        for (const node of smaller) {
            if (larger.has(node)) count++;
        }

        return count;
    }

    getRandomPair() {
        let i = Math.floor(Math.random() * this.nodeCount);
        let j = Math.floor(Math.random() * this.nodeCount);

        while (i === j) {
            j = Math.floor(Math.random() * this.nodeCount);
        }

        return [i, j];
    }
    
    print() {
        for (let i = 0; i < this.nodeCount; i++) {
            console.log(`${i}: ${[...this.adjacency[i]].join(" ")}`);
        }
    }

    printMatrix() {
        for (let i = 0; i < this.nodeCount; i++) {
            console.log(
                Array.from({ length: this.nodeCount }, (_, j) =>
                    this.hasEdge(i, j) ? 1 : 0
                ).join(" ")
            );
        }
    }

    validate() {
        let edges = 0;

        for (let i = 0; i < this.nodeCount; i++) {
            for (const j of this.adjacency[i]) {
                if (!this.adjacency[j].has(i)) {
                    throw new Error("Graph inconsistency");
                }
                if (j > i) edges++;
            }
        }

        if (edges !== this.edgeCount) {
            throw new Error("Wrong edge count");
        }
    }
    getDegreeDistribution(){
        const degrees=[];
        for(let i=0;i<this.nodeCount;i++){
            let degree=0;
            for(let j=0;j<this.nodeCount;j++){
                if(this.hasEdge(i,j)){
                    degree++;
                }
            }
            degrees.push(degree);
        }

        return degrees;
    }
}