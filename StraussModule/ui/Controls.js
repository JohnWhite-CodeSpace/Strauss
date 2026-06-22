export class Controls {

    getConfig() {
        return {
            nodes:
                Number(document.getElementById("nodes").value),
            theta:
                Number(document.getElementById("theta").value),
            sigma:
                Number(document.getElementById("sigma").value),
            steps:
                Number(document.getElementById("maxSteps").value),
            logInterval:
                Number(document.getElementById("logInterval").value),
            speed:
                Number(document.getElementById("speed").value),
            sigmaStart:
                parseFloat(document.getElementById("sigmaStart").value),
            sigmaEnd:
                parseFloat(document.getElementById("sigmaEnd").value),
            sigmaStep:
                parseFloat(document.getElementById("sigmaStep").value),
            stepsPerSigma:
                parseInt(document.getElementById("stepsPerSigma").value)
        };
    }

    onStart(callback) {
        document.getElementById("startBtn").addEventListener("click",callback);
    }

    onPause(callback) {
        document.getElementById("pauseBtn").addEventListener("click", callback);
    }

    onReset(callback) {
        document.getElementById("resetBtn").addEventListener("click", callback);
    }

    updateStats(stats){
        document.getElementById("statSteps").textContent = stats.steps;
        document.getElementById("statEdges").textContent = stats.edges;
        document.getElementById("statTriangles").textContent = stats.triangles;
        document.getElementById("statDensity").textContent = stats.density.toFixed(4);
        document.getElementById("statAcceptance").textContent = stats.acceptanceRate.toFixed(4);
    }

    setRunningState(running){
        document.getElementById("startBtn").disabled = running;
        document.getElementById("pauseBtn").disabled = !running;
    }

    onSaveConfig(callback){
        document.getElementById("savePresetBtn").addEventListener("click",callback);
    }

    onLoadConfig(callback){

        const fileInput = document.getElementById("yamlFileInput");
        document.getElementById("loadPresetBtn").addEventListener("click",()=> fileInput.click());
        fileInput.addEventListener(
            "change",()=>{const file = fileInput.files[0];
                if(file){
                    callback(file);
                }
            }
        );
    }

    setConfig(config){
            document.getElementById("nodes").value = config.nodes;
            document.getElementById("theta").value = config.theta;
            document.getElementById("sigma").value = config.sigma;
            document.getElementById("maxSteps").value = config.steps;
            document.getElementById("logInterval").value = config.logInterval;
            document.getElementById("speed").value = config.speed;
    }

    onThemeChange(callback){
        document.getElementById("themeSelector").addEventListener("change",callback);
    }
    onHysteresis(callback){
        document.getElementById("runHysteresisBtn").addEventListener("click",callback);
    }
    onRunHysteresis(callback){
        document
            .getElementById("runHysteresisBtn")
            .addEventListener("click",callback);
    }
    setHysteresisState(running){
        const button=document.getElementById("runHysteresisBtn");

        button.disabled=running;
        button.textContent=running ? "Running..." : "Run Hysteresis";
    }
    onPresentation(callback){
        document.getElementById("presentationBtn").addEventListener("click", callback);
    }
    onDocumentation(callback){
        document.getElementById("docsBtn").addEventListener("click", callback);
    }
}