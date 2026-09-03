import { CommandParser }
from "../utils/CommandParser.js";

export class Terminal{

    constructor(callback){
        this.input =document.getElementById("terminalInput");
        this.parser = new CommandParser();
        this.callback = callback;
        this.bindEvents();
    }

// #######################################################################################################
    bindEvents(){
        this.input.addEventListener(
            "keydown",
            (event)=>{
                if(event.key === "Enter"){
                    const text = this.input.value;
                    const parsed =this.parser.parse(text);
                    this.callback(parsed);
                    this.input.value = "";
                }
            }
        );
    }
}