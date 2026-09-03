import { Renderer } from "./Renderer.js";
import { ChartRenderer } from "./ChartRenderer.js";
import { YamlManager } from "../io/YamlManager.js";
import { Console } from "./Console.js";
import { Terminal } from "./Terminal.js";
import { Logger } from "../utils/Logger.js";
import { ThemeManager } from "../ui/ThemeManager.js";
import { HistogramRenderer } from "./HistogramRenderer.js";
import { Graph } from "../core/Graph.js";
import { WebSocketClient } from "./WebSocketClient.js";

// #######################################################################################################
export class App {
    constructor(controls){
        this.controls = controls;
        this.simulation = null;
        this.graph = null;
        this.history = {
            energy: [],
            acceptance: [],
            triangles: [],
            states: [],
            density: [],
            equilibrium: []
        };
        this.stats = null;
        this.renderer = new Renderer();
        this.layout = "circular";
        this.energyChart = new ChartRenderer("energyChart");
        this.acceptanceChart = new ChartRenderer("acceptanceChart");
        this.triangleChart = new ChartRenderer("triangleChart");
        this.densityChart = new ChartRenderer("densityChart");
        this.degreeChart = new HistogramRenderer("degreeChart");
        this.equilibriumChart = new ChartRenderer("equilibriumChart");
        this.hysteresisChart = new ChartRenderer("hysteresisChart");
        this.yamlManager = new YamlManager();
        this.console = new Console();
        this.logger = new Logger("consoleOutput");
        this.terminalLogger = new Logger("terminalOutput");
        this.terminal = new Terminal((command) => this.executeCommand(command));
        this.themeManager = new ThemeManager();
        this.webSocket = new WebSocketClient();
        this.running = false;
        this.hysteresisWorker = null;
        this.renderer.setLayout(this.layout);
        this.bindWebSocketEvents();
        this.bindEvents();
        this.themeManager.loadSavedTheme();
        this.animate();
    }

// #######################################################################################################
    bindWebSocketEvents(){

        this.webSocket.onConnected(() => {
            this.console.log("[WEBSOCKET] Connected to simulation server");
        });

        this.webSocket.onDisconnected(() => {
            this.console.log("[WEBSOCKET] Disconnected from simulation server");
            this.running = false;
            this.controls.setRunningState(false);
        });

        this.webSocket.onState((data) => {
            this.handleServerState(data);
        });

        this.webSocket.onFinished(() => {
            this.running = false;
            this.controls.setRunningState(false);
            this.console.log("Simulation finished");

            if(this.stats){
                this.console.log(`Final edges=${this.stats.edges}`);
            }
        });

        this.webSocket.onReset(() => {
            this.handleServerReset();
        });
    }

// #######################################################################################################
    bindEvents(){

        this.controls.onStart(() => this.start());
        this.controls.onPause(() => this.pause());
        this.controls.onReset(() => this.reset());
        this.controls.onSaveConfig(() => this.saveConfig());
        this.controls.onLoadConfig(() => this.loadConfig());
        this.controls.onThemeChange((event) => this.changeTheme(event.target.value));
        this.controls.onRunHysteresis(() => this.runHysteresis());
        this.controls.onPresentation(() => this.openPresentation());
        this.controls.onDocumentation(() => this.openDocumentation());
        this.controls.onLayoutChange((layout) => this.setLayout(layout));
        this.controls.onForceTemperatureChange((temperature) => this.setForceTemperature(temperature));
    }

// #######################################################################################################
    animate(){

        if(this.graph){
            this.renderer.updateLayout(this.graph);
            this.renderer.draw(this.graph);
        }

        requestAnimationFrame(() => this.animate());
    }

// #######################################################################################################
    setForceTemperature(temperature){
        if(!Number.isFinite(temperature) || temperature <= 0){
            return;
        }

        this.renderer.setForceTemperature(temperature);
        this.console.log(`[LAYOUT] Force temperature set to: ${temperature}`);
    }

// #######################################################################################################
    setLayout(layout){

        const validLayouts = ["circular", "force"];
        if(!validLayouts.includes(layout)){
            console.warn(`Unknown graph layout: ${layout}`);
            return;
        }

        if(this.layout === layout){
            return;
        }

        this.layout = layout;
        this.renderer.setLayout(layout);
        this.console.log(`[LAYOUT] Changed graph layout to: ${layout}`);

        if(this.graph){
            this.renderer.draw(this.graph);
        }
    }

// #######################################################################################################
    async start(){

        this.console.log("Simulation started");

        if(this.running){
            return;
        }

        const config = this.controls.getConfig();

        try{
            await this.webSocket.connect();

            this.console.log(
                `Nodes=${config.nodes}, ` +
                `Theta=${config.theta}, ` +
                `Sigma=${config.sigma}`
            );

            this.renderer.setLayout(this.layout);
            this.renderer.setForceTemperature(config.forceTemperature);

            if(!this.graph){
                this.renderer.resetLayout();
                this.renderer.clear();
                this.energyChart.clear();
                this.acceptanceChart.clear();
                this.triangleChart.clear();
                this.densityChart.clear();
                this.degreeChart.clear();
                this.equilibriumChart.clear();
            }

            this.running = true;
            this.controls.setRunningState(true);

            this.webSocket.start(config);
        }

        catch(error){
            console.error("[WEBSOCKET] Connection failed:", error);
            this.console.log(`[WEBSOCKET] Connection failed: ${error}`);
            this.running = false;
            this.controls.setRunningState(false);
        }
    }

// #######################################################################################################
    handleServerState(data){

        this.updateGraph(data.graph);
        this.stats = data.stats;
        this.history = data.history;
        this.updateCharts();
        this.controls.updateStats(this.stats);
    }

// #######################################################################################################
    updateCharts(){

        this.energyChart.draw(
            this.history.energy,
            {
                colorVar: "--chart-energy-color",
                yLabel: "Energy H(G)"
            }
        );

        this.acceptanceChart.draw(
            this.history.acceptance,
            {
                colorVar: "--chart-acceptance-color",
                yLabel: "Acceptance Rate",
                formatter: this.acceptanceChart.formatFloat
            }
        );

        this.triangleChart.draw(
            this.history.triangles,
            {
                colorVar: "--chart-triangle-color",
                yLabel: "Triangle Count"
            }
        );

        this.densityChart.draw(
            this.history.density,
            {
                yLabel: "Density",
                colorVar: "--chart-density-color",
                formatter: this.formatFloat
            }
        );

        this.degreeChart.draw(
            this.graph.getDegreeDistribution()
        );

        this.equilibriumChart.draw(
            this.history.equilibrium,
            {
                yLabel: "Variance",
                colorVar: "--chart-equilibrium-color"
            }
        );
    }

// #######################################################################################################
    updateGraph(graphState){

        const graph = new Graph(graphState.nodeCount);

        for(const [i,j] of graphState.edges){
            graph.addEdge(i,j);
        }

        this.graph = graph;
    }

// #######################################################################################################
    runHysteresis(){

        const config = this.controls.getConfig();
        const totalIterations = ((config.sigmaEnd - config.sigmaStart)/config.sigmaStep)*config.stepsPerSigma*2;

        if(totalIterations > 5000000){
            alert("Too many iterations");
            return;
        }

        this.hysteresisChart.clear();
        this.console.log("Starting hysteresis test...");
        this.controls.setHysteresisState(true);

        this.hysteresisWorker = new Worker(
            "./StraussModule/workers/HisteresisWorker.js",
            {type:"module"}
        );

        this.hysteresisWorker.postMessage({
            nodes: config.nodes,
            theta: config.theta,
            sigmaStart: config.sigmaStart,
            sigmaEnd: config.sigmaEnd,
            sigmaStep: config.sigmaStep,
            stepsPerSigma: config.stepsPerSigma
        });

        this.hysteresisWorker.onmessage = (event) => {
            const data = event.data;

            if(data.type === "progress"){
                this.console.log(
                    `Processing sigma=${data.sigma.toFixed(2)}`
                );
            }

            if(data.type === "done"){
                this.hysteresisChart.drawTwoLines(
                    data.forward,
                    data.backward,
                    {
                        colorVar:"--chart-hysteresis-color",
                        yLabel: "Edges",
                        xLabel: "Sigma",
                        xAccessor: (p) => p.sigma
                    },
                    {
                        colorVar: "--chart-equilibrium-color",
                        yLabel: "Edges",
                        xLabel: "Sigma",
                        xAccessor: (p) => p.sigma
                    }
                );

                this.console.log("Hysteresis completed");
                this.hysteresisWorker.terminate();
                this.controls.setHysteresisState(false);
            }
        };

        this.hysteresisWorker.onerror =
            (error) => {
                console.error("Worker error:", error);
                this.console.log(`Hysteresis failed: ${error.message}`);
                this.hysteresisWorker.terminate();
                this.controls.setHysteresisState(false);
            };
    }

// #######################################################################################################
    pause(){
        if(!this.running){
            return;
        }

        this.webSocket.pause();
        this.running = false;
        this.controls.setRunningState(false);
        this.console.log("Simulation paused");
    }

// #######################################################################################################
    reset(){
        this.running = false;

        if(this.webSocket.socket &&
            this.webSocket.socket.readyState === WebSocket.OPEN){

            this.webSocket.reset();
        }
        else{
            this.handleServerReset();
        }
    }

// #######################################################################################################
    handleServerReset(){

        this.running = false;
        this.simulation = null;
        this.graph = null;
        this.stats = null;

        this.history = {
            energy: [],
            acceptance: [],
            triangles: [],
            states: [],
            density: [],
            equilibrium: []
        };

        this.renderer.resetLayout();
        this.renderer.clear();
        this.energyChart.clear();
        this.acceptanceChart.clear();
        this.triangleChart.clear();
        this.densityChart.clear();
        this.degreeChart.clear();
        this.equilibriumChart.clear();

        this.controls.setRunningState(false);

        this.controls.updateStats({
            steps: 0,
            edges: 0,
            triangles: 0,
            density: 0,
            acceptanceRate: 0
        });

        this.console.log("Simulation reset");
    }

// #######################################################################################################
    saveConfig(){
        const config = this.controls.getConfig();
        this.yamlManager.save(config);
        this.console.log("[CONFIG] Saved config");
    }

// #######################################################################################################
    async loadConfig(){

        if(!window.electronAPI){
            console.error("[CONFIG] electronAPI is not available");
            return;
        }

        try{
            const result = await window.electronAPI.openConfig();
            if(result.canceled){
                return;
            }
            const file = new File([result.content], result.name, {type: "application/x-yaml"});
            const config = await this.yamlManager.load(file);
            this.controls.setConfig(config);
            this.console.log(`[CONFIG] Loaded config: ${result.name}`);

        }
        catch(error){
            console.error(error);
            this.console.log(`[CONFIG] Failed to load config: ${error}`);
            alert("Invalid YAML file");
        }
    }

// #######################################################################################################
    executeCommand(parsed){

        const command = parsed.command;
        const args = parsed.args;

        switch(command){
            case "start":
                this.start();
                this.terminalLogger.log("Simulation started");
                break;

            case "pause":
                this.pause();
                this.terminalLogger.log("Simulation paused");
                break;

            case "reset":
                this.reset();
                this.terminalLogger.log("Simulation reset");
                break;

            case "setNodes":
                this.setInputValue("nodes", args[0]);
                break;

            case "setTheta":
                this.setInputValue("theta", args[0]);
                break;

            case "setSigma":
                this.setInputValue("sigma", args[0]);
                break;

            case "setSpeed":
                this.setInputValue("speed", args[0]);
                break;

            case "setLayout":
                this.setLayout(args[0]);
                this.terminalLogger.log(`Layout set to ${args[0]}`);
                break;

            case "help":
                this.printHelp();
                break;

            case "clear":
                this.terminalLogger.clear();
                break;

            case "status":
                this.printStatus();
                break;

            default:
                this.terminalLogger.log("Unknown command", "ERROR");
        }
    }

// #######################################################################################################
    setInputValue(id,value){
        document.getElementById(id).value = value;
        this.terminalLogger.log(`${id} set to ${value}`);
    }

// #######################################################################################################
    printHelp(){
        const commands = [
            "start",
            "pause",
            "reset",
            "status",
            "setNodes <number>",
            "setTheta <number>",
            "setSigma <number>",
            "setMaxSteps <number>",
            "setLogInterval <number>",
            "setSpeed <number>",
            "setLayout <circular|force>",
            "clear",
            "help"
        ];

        this.terminalLogger.log("Available commands:");
        commands.forEach(command => {
            this.terminalLogger.log(command);
        });
    }

// #######################################################################################################
    printStatus(){

        const config = this.controls.getConfig();
        const simulationState = this.graph ? "Initialized" : "Not initialized";

        this.terminalLogger.log("=== STATUS ===");
        this.terminalLogger.log(`Simulation: ${simulationState}`);
        this.terminalLogger.log(`Running: ${this.running}`);
        this.terminalLogger.log(`Layout: ${this.layout}`);
        this.terminalLogger.log(`Nodes: ${config.nodes}`);
        this.terminalLogger.log(`Theta: ${config.theta}`);
        this.terminalLogger.log(`Sigma: ${config.sigma}`);
        this.terminalLogger.log(`Max Steps: ${config.steps}`);
        this.terminalLogger.log(`Speed: ${config.speed}`);
        this.terminalLogger.log(`Force Temperature: ${config.forceTemperature}`);

        if(this.graph && this.stats){
            this.terminalLogger.log(`Current Steps: ${this.stats.steps}`);
            this.terminalLogger.log(`Edges: ${this.stats.edges}`);
            this.terminalLogger.log(`Triangles: ${this.stats.triangles}`);
        }
    }

// #######################################################################################################
    changeTheme(theme){
        this.themeManager.applyTheme(theme);

        if(this.graph){
            this.renderer.draw(this.graph);
            this.updateCharts();
        }
    }

// #######################################################################################################
    async openPresentation(){

        if(!window.electronAPI){
            console.error("[PRESENTATION] electronAPI is not available");
            return;
        }

        const result = await window.electronAPI.openPresentation();

        if(!result.success){
            console.error("[PRESENTATION] Error:", result.error);
        }
    }

// #######################################################################################################
    openDocumentation(){
        window.open(
            "https://github.com/JohnWhite-CodeSpace/Strauss",
            "_blank"
        );

        this.console.log("[INFO] Opening documentation...");
    }
}