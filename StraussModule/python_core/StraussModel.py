class StraussModel:

########################################################################################################
    def __init__(self, theta, sigma):
        self.theta = theta
        self.sigma = sigma

########################################################################################################
    def computeDelta(self, graph, i, j):

        edgeExists = graph.hasEdge(i, j)
        deltaEdges = -1 if edgeExists else 1
        commonNeighbors = graph.commonNeighbors(i, j)
        deltaTriangles = (-commonNeighbors if edgeExists else commonNeighbors)
        result = (self.theta * deltaEdges + self.sigma * deltaTriangles)

        return result

########################################################################################################
    def calculateEnergy(self, graph):

        edges = graph.countEdges()
        triangles = graph.countTriangles()
        return (self.theta * edges + self.sigma * triangles)