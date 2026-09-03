import math
import random
import numpy as np
from numba import njit

########################################################################################################
@njit(cache=True)
def monteCarloKernel(adjacency, degrees, nodeCount, theta, sigma, numberOfSteps,
    steps, acceptedMoves, edgeCount, triangleCount):

    for _ in range(numberOfSteps):
        i = np.random.randint(0, nodeCount)
        j = np.random.randint(0, nodeCount)
        while i == j:
            j = np.random.randint(0, nodeCount)

        edgeExists = adjacency[i, j] == 1
        commonNeighbors = 0

        for node in range(nodeCount):
            if adjacency[i, node] == 1 and adjacency[j, node] == 1:
                commonNeighbors += 1

        deltaEdges = -1 if edgeExists else 1
        deltaTriangles = -commonNeighbors if edgeExists else commonNeighbors
        deltaH = (theta * deltaEdges + sigma * deltaTriangles)
        accepted = False

        if deltaH >= 0:
            accepted = True
        else:
            probability = math.exp(deltaH)

            if np.random.random() < probability:
                accepted = True

        if accepted:
            if edgeExists:

                adjacency[i, j] = 0
                adjacency[j, i] = 0
                degrees[i] -= 1
                degrees[j] -= 1
                edgeCount -= 1
                triangleCount -= commonNeighbors

            else:
                adjacency[i, j] = 1
                adjacency[j, i] = 1
                degrees[i] += 1
                degrees[j] += 1
                edgeCount += 1
                triangleCount += commonNeighbors
            acceptedMoves += 1
        steps += 1

    return (steps, acceptedMoves, edgeCount,triangleCount)


class MonteCarlo:

########################################################################################################
    def __init__(self, graph, model, options=None):

        if options is None:
            options = {}

        self.graph = graph
        self.model = model
        self.steps = 0
        self.acceptedMoves = 0
        self.logInterval = options.get("logInterval", 0)
        self.history = {
            "energy": [],
            "acceptance": [],
            "triangles": [],
            "states": [],
            "density": [],
            "equilibrium": []
        }

########################################################################################################
    def acceptMove(self, deltaH):
        if deltaH >= 0:
            return True
        probability = math.exp(deltaH)
        return random.random() < probability

########################################################################################################
    def saveSnapshot(self):
        acceptanceRate = (self.acceptedMoves / self.steps if self.steps > 0 else 0)
        self.history["states"].append({
            "step": self.steps,
            "edges": self.graph.countEdges(),
            "triangles": self.graph.countTriangles(),
            "acceptedMoves": self.acceptedMoves,
            "acceptanceRate": acceptanceRate
        })

########################################################################################################
    def saveChartData(self):

        energy = self.model.calculateEnergy(self.graph)
        triangles = self.graph.countTriangles()
        acceptanceRate = (self.acceptedMoves / self.steps if self.steps > 0 else 0)
        maxEdges = (self.graph.nodeCount * (self.graph.nodeCount - 1) / 2)
        density = (self.graph.countEdges() / maxEdges if maxEdges > 0 else 0)
        recent = self.history["energy"][-50:]
        variance = 0

        if len(recent) > 10:
            mean = sum(point["value"] for point in recent) / len(recent)
            variance = sum((point["value"] - mean) ** 2 for point in recent) / len(recent)

        self.history["energy"].append({"step": self.steps, "value": energy})
        self.history["acceptance"].append({"step": self.steps, "value": acceptanceRate})
        self.history["triangles"].append({"step": self.steps, "value": triangles})
        self.history["density"].append({"step": self.steps, "value": density})
        self.history["equilibrium"].append({"step": self.steps, "value": variance})

########################################################################################################
    def step(self):
        i, j = self.graph.getRandomPair()
        deltaH = self.model.computeDelta(self.graph, i, j)
        accepted = self.acceptMove(deltaH)

        if accepted:
            self.graph.toggleEdge(i, j)
            self.acceptedMoves += 1

        self.steps += 1

        if (self.logInterval > 0 and self.steps % self.logInterval == 0):
            self.saveSnapshot()
            self.saveChartData()

        return accepted

########################################################################################################
    def run(self, numberOfSteps):

        (self.steps, self.acceptedMoves, self.graph.edgeCount, self.graph.triangleCount) = monteCarloKernel(self.graph.adjacency,
            self.graph.degrees, self.graph.nodeCount, self.model.theta, self.model.sigma, numberOfSteps,
            self.steps, self.acceptedMoves, self.graph.edgeCount, self.graph.triangleCount)

        if self.logInterval > 0:
            self.saveSnapshot()
            self.saveChartData()

########################################################################################################
    def getHistory(self):
        return self.history

########################################################################################################
    def clearHistory(self):
        self.history = {
            "energy": [],
            "acceptance": [],
            "triangles": [],
            "states": [],
            "density": [],
            "equilibrium": []
        }

########################################################################################################
    def getStats(self):
        maxEdges = (self.graph.nodeCount * (self.graph.nodeCount - 1) / 2)

        return {
            "steps": self.steps,
            "acceptedMoves": self.acceptedMoves,
            "acceptanceRate": self.acceptedMoves / self.steps if self.steps > 0 else 0,
            "edges": self.graph.countEdges(),
            "triangles": self.graph.countTriangles(),
            "density": self.graph.countEdges() / maxEdges if maxEdges > 0 else 0
        }