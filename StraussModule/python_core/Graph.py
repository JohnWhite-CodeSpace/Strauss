import numpy as np
import random


class Graph:

    def __init__(self, nodeCount):
        self.nodeCount = nodeCount
        self.adjacency = np.zeros((nodeCount, nodeCount), dtype=np.uint8)
        self.edgeCount = 0
        self.triangleCount = 0
        self.degrees = np.zeros(nodeCount, dtype=np.uint32)

    def hasEdge(self, i, j):
        return self.adjacency[i, j] == 1

    def addEdge(self, i, j):
        if i == j or self.hasEdge(i, j):
            return False

        deltaTriangles = self.commonNeighbors(i, j)
        self.adjacency[i, j] = 1
        self.adjacency[j, i] = 1
        self.edgeCount += 1
        self.triangleCount += deltaTriangles
        self.degrees[i] += 1
        self.degrees[j] += 1

        return True


    def removeEdge(self, i, j):
        if not self.hasEdge(i, j):
            return False

        deltaTriangles = self.commonNeighbors(i, j)
        self.adjacency[i, j] = 0
        self.adjacency[j, i] = 0
        self.edgeCount -= 1
        self.triangleCount -= deltaTriangles
        self.degrees[i] -= 1
        self.degrees[j] -= 1

        return True


    def toggleEdge(self, i, j):
        if self.hasEdge(i, j):
            return self.removeEdge(i, j)

        return self.addEdge(i, j)


    def degree(self, i):
        return int(self.degrees[i])


    def countEdges(self):
        return self.edgeCount


    def countTriangles(self):
        return self.triangleCount


    def commonNeighbors(self, i, j):
        count = 0
        for node in range(self.nodeCount):
            if self.adjacency[i, node] and self.adjacency[j, node]:
                count += 1

        return count


    def getRandomPair(self):
        i = random.randrange(self.nodeCount)
        j = random.randrange(self.nodeCount)

        while i == j:
            j = random.randrange(self.nodeCount)

        return i, j


    def getEdges(self):
        edges = []

        for i in range(self.nodeCount):
            for j in range(i + 1, self.nodeCount):
                if self.adjacency[i, j]:
                    edges.append([i, j])

        return edges


    def print(self):
        for i in range(self.nodeCount):
            neighbors = np.where(self.adjacency[i] == 1)[0]
            print(f"{i}: {' '.join(map(str, neighbors))}")

    def printMatrix(self):
        for i in range(self.nodeCount):
            print(" ".join(str(int(value)) for value in self.adjacency[i]))


    def validate(self):
        edges = 0

        for i in range(self.nodeCount):
            for j in range(i + 1, self.nodeCount):

                if self.adjacency[i, j] != self.adjacency[j, i]:
                    raise RuntimeError("Graph inconsistency")

                if self.adjacency[i, j]:
                    edges += 1

        if edges != self.edgeCount:
            raise RuntimeError("Wrong edge count")


    def getDegreeDistribution(self):
        degrees = []

        for i in range(self.nodeCount):
            degree = 0

            for j in range(self.nodeCount):
                if self.hasEdge(i, j):
                    degree += 1

            degrees.append(degree)

        return degrees
