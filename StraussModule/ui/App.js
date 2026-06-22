import { Graph } from "../core/Graph.js";
import { MonteCarlo } from "../core/MonteCarlo.js";
import { StraussModel } from "../core/StraussModel.js";
import { Renderer } from "./Renderer.js"
import { ChartRenderer } from "./ChartRenderer.js";
import { YamlManager } from "../io/YamlManager.js";
import { Console } from "./Console.js";
import { Terminal } from "./Terminal.js";
import { Logger } from "../utils/Logger.js";
import { ThemeManager } from "../ui/ThemeManager.js";
import { HistogramRenderer } from "./HistogramRenderer.js";
export class App {

    constructor(controls){

        this.controls = controls;

        this.simulation = null;
        this.renderer = new Renderer();
        this.energyChart = new ChartRenderer("energyChart");
        this.acceptanceChart = new ChartRenderer("acceptanceChart");
        this.triangleChart = new ChartRenderer("triangleChart");
        this.densityChart=new ChartRenderer("densityChart");
        this.degreeChart= new HistogramRenderer("degreeChart");
        this.equilibriumChart=new ChartRenderer("equilibriumChart");
        this.hysteresisChart = new ChartRenderer("hysteresisChart");
        this.yamlManager = new YamlManager();
        this.console = new Console();
        this.logger = new Logger("consoleOutput");
        this.terminalLogger = new Logger("terminalOutput");
        this.terminal = new Terminal((command)=>this.executeCommand(command));
        this.themeManager = new ThemeManager();
        this.running = false;
        this.hysteresisWorker=null;
        this.bindEvents();
        this.themeManager.loadSavedTheme();
    }

    bindEvents(){

        this.controls.onStart(() => this.start());
        this.controls.onPause(() => this.pause());
        this.controls.onReset(() => this.reset());
        this.controls.onSaveConfig(()=> this.saveConfig());
        this.controls.onLoadConfig((file)=> this.loadConfig(file));
        this.controls.onThemeChange((event) =>this.changeTheme(event.target.value));
        this.controls.onHysteresis(()=>this.runHysteresis());
        this.controls.onRunHysteresis(()=>this.runHysteresis());
        this.controls.onPresentation(() => this.openPresentation());
        this.controls.onDocumentation(() => this.openDocumentation());
    }
    start(){
    this.console.log("Simulation started");
        if(this.running){
            return;
        }

        if(!this.simulation){
            const config = this.controls.getConfig();
            this.console.log(`Nodes=${config.nodes}, Theta=${config.theta}, Sigma=${config.sigma}`);
            const graph = new Graph(config.nodes);
            const model = new StraussModel(config.theta, config.sigma);
            this.simulation = new MonteCarlo(graph, model, {logInterval: config.logInterval});
            this.speed = config.speed;
            this.maxSteps =config.steps;
            this.renderer.clear()
            this.energyChart.clear();
        }

        this.running = true;
        this.controls.setRunningState(true);
        this.animate();
    }

    animate(){

        if(!this.running){
            return;
        }

        for(let i = 0; i < this.speed; i++){
            this.simulation.step();
            if(this.simulation.steps >=this.maxSteps){
                this.running = false;
                this.console.log("Simulation finished");
                this.console.log(`Final edges=${this.simulation.graph.countEdges()}`);
                break;
            }
        }

        this.renderer.draw(this.simulation.graph);
        this.energyChart.draw(this.simulation.history.energy,{colorVar: "--chart-energy-color", yLabel: "Energy H(G)"});
        this.acceptanceChart.draw(this.simulation.history.acceptance,{colorVar: "--chart-acceptance-color",yLabel: "Acceptance Rate",formatter: this.acceptanceChart.formatFloat});
        this.triangleChart.draw(this.simulation.history.triangles,{colorVar: "--chart-triangle-color", yLabel: "Triangle Count"});
        this.densityChart.draw(this.simulation.history.density,{yLabel:"Density",colorVar:"--chart-density-color",formatter:this.formatFloat});
        this.degreeChart.draw(this.simulation.graph.getDegreeDistribution());
        this.equilibriumChart.draw(this.simulation.history.equilibrium,{yLabel:"Variance",colorVar:"--chart-equilibrium-color"});
        this.controls.updateStats(this.simulation.getStats());
        if(this.running){
            requestAnimationFrame(() => this.animate());
        }
        else{
            this.controls.setRunningState(false);
        }
    }

    runHysteresis(){
        const config=this.controls.getConfig();
        const totalIterations=((config.sigmaEnd-config.sigmaStart)/config.sigmaStep)*config.stepsPerSigma*2;
        if(totalIterations>5000000){
            alert("Too many iterations");
            return;
        }
        this.hysteresisChart.clear();
        this.console.log("Starting hysteresis test...");
        this.controls.setHysteresisState(true);
        this.hysteresisWorker=new Worker("./StraussModule/workers/HisteresisWorker.js",{type:"module"});
        this.hysteresisWorker.postMessage({
            nodes:config.nodes,
            theta:config.theta,
            sigmaStart:config.sigmaStart,
            sigmaEnd:config.sigmaEnd,
            sigmaStep:config.sigmaStep,
            stepsPerSigma:config.stepsPerSigma
        });
        
        this.hysteresisWorker.onmessage=(event)=>{
            const data=event.data;
            if(data.type==="progress"){
                this.console.log(`Processing sigma=${data.sigma.toFixed(2)}`);
            }

            if(data.type==="done"){
                this.hysteresisChart.drawTwoLines(
                    data.forward,
                    data.backward,
                    {
                        colorVar:"--chart-hysteresis-color",
                        yLabel:"Edges",
                        xLabel:"Sigma",
                        xAccessor:(p)=>p.sigma
                    },
                    {
                        colorVar:"--chart-equilibrium-color",
                        yLabel:"Edges",
                        xLabel:"Sigma",
                        xAccessor:(p)=>p.sigma
                    }
                );
                this.console.log("Hysteresis completed");
                this.hysteresisWorker.terminate();
                this.controls.setHysteresisState(false);
            }
        }
        this.hysteresisWorker.onerror=(error)=>{
            console.error("Worker error:",error);
            this.console.log(`Hysteresis failed: ${error.message}`);
            this.hysteresisWorker.terminate();
            this.controls.setHysteresisState(false);
        }
    }

    pause(){
        this.running = false;
        this.controls.setRunningState(false);
        this.console.log("Simulation paused");
    }

    reset(){
        this.running = false;
        this.simulation = null;
        this.renderer.clear();
        this.energyChart.clear();
        this.acceptanceChart.clear();
        this.triangleChart.clear();
        this.densityChart.clear();
        this.degreeChart.clear();
        this.equilibriumChart.clear();
        this.controls.setRunningState(false);
        this.controls.updateStats({steps: 0, edges: 0, triangles: 0, density: 0, acceptanceRate: 0});
        this.console.log("Simulation reset");
    }

    saveConfig(){
        const config = this.controls.getConfig();
        this.yamlManager.save(config);
        this.console.log("[CONFIG] Saved config")
    }

    async loadConfig(file){
        try{
            const config = await this.yamlManager.load(file);
            this.controls.setConfig(config);
            this.console.log(`[CONFIG] Loaded config: ${file.name}`);
        }
        catch(error){
            console.error(error);
            this.console.log(`[CONFIG] Failed to load config: ${file.name}, ${error}`);
            alert("Invalid YAML file");
        }
    }
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
                this.setInputValue("nodes",args[0]);
                break;
            case "setTheta":
                this.setInputValue("theta", args[0]);
                break;

            case "setSigma":
                this.setInputValue("sigma", args[0]);
                break;

            case "setSpeed":
                this.setInputValue("speed",args[0]);
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

    setInputValue(id,value){
        document.getElementById(id).value = value;
        this.terminalLogger.log(`${id} set to ${value}`);
    }

    printHelp(){

        const commands = ["start", "pause","reset",
            "status", "setNodes <number>", "setTheta <number>",
            "setSigma <number>", "setMaxSteps <number>", "setLogInterval <number>",
            "setSpeed <number>", "clear", "help"
        ];

        this.terminalLogger.log("Available commands:");
        commands.forEach(command => {
            this.terminalLogger.log(command);
        });
    }

    printStatus(){

        const config = this.controls.getConfig();
        const simulationState = this.simulation ? "Initialized": "Not initialized";
        this.terminalLogger.log("=== STATUS ===");
        this.terminalLogger.log(`Simulation: ${simulationState}`);
        this.terminalLogger.log(`Running: ${this.running}`);
        this.terminalLogger.log(`Nodes: ${config.nodes}`);
        this.terminalLogger.log(`Theta: ${config.theta}`);
        this.terminalLogger.log(`Sigma: ${config.sigma}`);
        this.terminalLogger.log(`Max Steps: ${config.steps}`);
        this.terminalLogger.log(`Speed: ${config.speed}`);
        if(this.simulation){
            this.terminalLogger.log(`Current Steps: ${this.simulation.steps}`);
            this.terminalLogger.log(`Edges: ${this.simulation.graph.countEdges()}`);
            this.terminalLogger.log(`Triangles: ${this.simulation.graph.countTriangles()}`);
        }
    }
    changeTheme(theme){
        this.themeManager.applyTheme(theme);
        if(this.simulation){
            this.renderer.draw(this.simulation.graph);
            this.energyChart.draw(this.simulation.history.energy,this.energyConfig);
            this.acceptanceChart.draw(this.simulation.history.acceptance,this.acceptanceConfig);
            this.triangleChart.draw(this.simulation.history.triangles,this.triangleConfig);
        }
    }
    openPresentation(){
        const pdfPath="./res/presentation.pdf";
        window.open(pdfPath,"_blank");
    }
    openDocumentation(){
        window.open("https://github.com/JohnWhite-CodeSpace/Strauss","_blank");
        this.console.log("[INFO] Opening documentation...");
    }
}