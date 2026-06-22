export class Console{

    constructor(){
        this.consoleOutput = document.getElementById("consoleOutput");
        this.terminalOutput = document.getElementById("terminalOutput");

        this.setupTabs();
    }

    setupTabs(){

        const consoleTab = document.getElementById("consoleTab");
        const terminalTab = document.getElementById("terminalTab");
        const consolePanel = document.getElementById("consolePanel");
        const terminalPanel = document.getElementById("terminalPanel");
        consoleTab.addEventListener("click", ()=>{
            consoleTab.classList.add("active");
            terminalTab.classList.remove("active");
            consolePanel.classList.add("active");
            terminalPanel.classList.remove("active");
        });

        terminalTab.addEventListener("click", ()=>{
            terminalTab.classList.add("active");
            consoleTab.classList.remove("active");
            terminalPanel.classList.add("active");
            consolePanel.classList.remove("active");
        });
    }

    log(message){
        const time =new Date().toLocaleTimeString();
        this.consoleOutput.innerHTML += `[${time}] ${message}\n`;
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    clear(){
        this.consoleOutput.innerHTML = "";
    }
}