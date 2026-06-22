export class Logger{

    constructor(outputId){
        this.output =
            document.getElementById(outputId);
    }

    log(message,type="INFO"){
        const time = new Date().toLocaleTimeString();
        this.output.innerHTML +=`[${time}] [${type}] ${message}\n`;
        this.output.scrollTop = this.output.scrollHeight;
    }

    clear(){
        this.output.innerHTML = "";
    }
}