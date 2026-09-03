import asyncio
import json
import websockets

from Graph import Graph
from StraussModel import StraussModel
from MonteCarlo import MonteCarlo


class SimulationServer:

########################################################################################################
    def __init__(self):

        self.graph = None
        self.model = None
        self.monteCarlo = None
        self.running = False
        self.maxSteps = 0
        self.stepsPerUpdate = 100
        self.speed = 100
        self.simulationTask = None

########################################################################################################
    def createSimulation(self, config):
        nodes = config["nodes"]
        theta = config["theta"]
        sigma = config["sigma"]
        self.maxSteps = config["steps"]
        logInterval = config["logInterval"]
        self.speed = config.get("speed", 100)
        self.graph = Graph(nodes)
        self.model = StraussModel(theta, sigma)
        self.monteCarlo = MonteCarlo(self.graph, self.model, {"logInterval": logInterval})

########################################################################################################
    def getGraphState(self):
        return {"nodeCount": self.graph.nodeCount, "edges": self.graph.getEdges()}

########################################################################################################
    def getState(self):
        stats = self.monteCarlo.getStats()

        return {
            "type": "state",
            "stats": stats,
            "graph": self.getGraphState(),
            "history": self.monteCarlo.getHistory()
        }

########################################################################################################
    async def runSimulation(self, websocket):

        while (self.running and self.monteCarlo.steps < self.maxSteps):

            remainingSteps = (self.maxSteps - self.monteCarlo.steps)
            steps = min(self.stepsPerUpdate, remainingSteps)

            self.monteCarlo.run(steps)

            state = self.getState()

            await websocket.send(json.dumps(state))

            delay = 1 / max(self.speed, 1)

            await asyncio.sleep(delay)

        if (self.monteCarlo.steps >= self.maxSteps):
            self.running = False
            await websocket.send(json.dumps({"type": "finished"}))

########################################################################################################
    async def handleMessage(self, websocket, message):

        data = json.loads(message)
        command = data.get("command")

        if command == "start":
            config = data["config"]

            if self.monteCarlo is None:
                self.createSimulation(config)

            self.running = True

            if (self.simulationTask is None or self.simulationTask.done()):
                self.simulationTask = asyncio.create_task(self.runSimulation(websocket))

        elif command == "pause":
            self.running = False
        elif command == "reset":
            self.running = False

            if self.simulationTask:
                self.simulationTask.cancel()
                self.simulationTask = None

            self.graph = None
            self.model = None
            self.monteCarlo = None
            await websocket.send(json.dumps({"type": "reset"}))

        elif command == "getState":

            if self.monteCarlo:
                state = self.getState()
                await websocket.send(json.dumps(state))

########################################################################################################
async def websocketHandler(websocket):

    server = SimulationServer()
    print("Client connected")
    try:
        async for message in websocket:
            await server.handleMessage(websocket, message)

    except websockets.ConnectionClosed:
        print("Client disconnected")

    finally:
        if server.simulationTask:
            server.simulationTask.cancel()

########################################################################################################
async def main():
    async with websockets.serve(websocketHandler, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())