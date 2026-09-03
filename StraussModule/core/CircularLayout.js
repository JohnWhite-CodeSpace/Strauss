
export class CircularLayout {

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

// #######################################################################################################
    compute(graph) {

        const positions = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.4;

        for (let i = 0; i < graph.nodeCount; i++) {
            const angle =(2 * Math.PI * i)/graph.nodeCount;
            const x = centerX + radius * Math.cos(angle);
            const y =centerY + radius * Math.sin(angle);
            positions.push({x, y});
        }
        return positions;
    }
}

