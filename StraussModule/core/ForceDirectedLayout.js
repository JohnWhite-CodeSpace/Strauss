export class ForceDirectedLayout {

    constructor(graph, width, height, temperature = Math.min(width, height) / 10) {
        this.graph = graph;
        this.width = width;
        this.height = height;
        this.positions = [];
        this.displacements = [];
        this.margin = 30;
        this.k = Math.sqrt((width * height) / graph.nodeCount) * 0.55;
        this.initialTemperature = temperature;
        this.temperature = temperature;
        this.minimumTemperature = 0.5;
        this.coolingFactor = 0.99;
        this.iteration = 0;
        this.initialize();
    }

// #######################################################################################################
    initialize() {

        this.positions = [];
        this.displacements = [];

        for(let i = 0; i < this.graph.nodeCount; i++) {
            this.positions.push({x: this.randomX(), y: this.randomY()});
            this.displacements.push({x: 0, y: 0});
        }
    }

// #######################################################################################################
    randomX() {
        return (this.margin + Math.random() * (this.width - 2 * this.margin));
    }

// #######################################################################################################
    randomY() {
        return (this.margin + Math.random() * (this.height - 2 * this.margin));
    }

// #######################################################################################################
    step() {
        const n = this.graph.nodeCount;

        if(this.positions.length !== n || this.displacements.length !== n) {
            this.initialize();
        }

        for(let i = 0; i < n; i++) {
            this.displacements[i].x = 0;
            this.displacements[i].y = 0;
        }

        for(let i = 0; i < n; i++) {
            for(let j = i + 1; j < n; j++) {
                let dx = this.positions[i].x - this.positions[j].x;
                let dy = this.positions[i].y - this.positions[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if(distance < 0.01) {
                    dx = Math.random() - 0.5;
                    dy = Math.random() - 0.5;
                    distance = Math.sqrt(dx * dx + dy * dy);
                }

                const force = (this.k * this.k) / distance;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                this.displacements[i].x += fx;
                this.displacements[i].y += fy;
                this.displacements[j].x -= fx;
                this.displacements[j].y -= fy;
            }
        }

        for(let i = 0; i < n; i++) {
            for(const j of this.graph.adjacency[i]) {
                if(j <= i) {
                    continue;
                }

                const dx = this.positions[i].x - this.positions[j].x;
                const dy = this.positions[i].y - this.positions[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if(distance < 0.01) {
                    distance = 0.01;
                }

                const force = (distance * distance) / this.k;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                this.displacements[i].x -= fx;
                this.displacements[i].y -= fy;
                this.displacements[j].x += fx;
                this.displacements[j].y += fy;
            }
        }

        for(let i = 0; i < n; i++) {
            const dx = this.displacements[i].x;
            const dy = this.displacements[i].y;
            const displacementLength = Math.sqrt(dx * dx + dy * dy);

            if(displacementLength > 0) {
                const limitedDistance = Math.min(displacementLength, this.temperature);

                this.positions[i].x += (dx / displacementLength) * limitedDistance;
                this.positions[i].y += (dy / displacementLength) * limitedDistance;
            }

            this.positions[i].x = Math.max(
                this.margin,
                Math.min(this.width - this.margin, this.positions[i].x)
            );

            this.positions[i].y = Math.max(
                this.margin,
                Math.min(this.height - this.margin, this.positions[i].y)
            );
        }

        this.temperature = Math.max(
            this.minimumTemperature,
            this.temperature * this.coolingFactor
        );

        this.iteration++;
    }

// #######################################################################################################
    run(iterations = 100) {

        for(let i = 0; i < iterations; i++) {
            this.step();
        }

        return this.positions;
    }

// #######################################################################################################
    reset() {
        this.temperature = this.initialTemperature;
        this.iteration = 0;
        this.initialize();
    }

// #######################################################################################################
    setTemperature(temperature) {
        if(!Number.isFinite(temperature) || temperature <= 0) {
            return;
        }

        this.temperature = temperature;
        this.initialTemperature = temperature;
    }
}