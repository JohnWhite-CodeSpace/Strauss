export class WebSocketClient {

    constructor(url = "ws://localhost:8765"){

        this.url = url;
        this.socket = null;
        this.onStateCallback = null;
        this.onFinishedCallback = null;
        this.onResetCallback = null;
        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
    }

// #######################################################################################################
    connect(){
        return new Promise((resolve, reject) => {
            if(this.socket && this.socket.readyState === WebSocket.OPEN){
                resolve();
                return;
            }

            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {console.log("[WEBSOCKET] Connected to simulation server");
                if(this.onConnectedCallback){
                    this.onConnectedCallback();
                }
                resolve();
            };


            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };


            this.socket.onerror = (error) => {
                console.error("[WEBSOCKET] Error:", error);
                reject(error);
            };

            this.socket.onclose = () => {
                console.log("[WEBSOCKET] Disconnected");
                if(this.onDisconnectedCallback){
                    this.onDisconnectedCallback();
                }
            };
        });
    }

// #######################################################################################################
    handleMessage(data){

        switch(data.type){

            case "state":
                if(this.onStateCallback){
                    this.onStateCallback(data);
                }
                break;

            case "finished":
                if(this.onFinishedCallback){
                    this.onFinishedCallback();
                }
                break;

            case "reset":
                if(this.onResetCallback){
                    this.onResetCallback();
                }
                break;

            default:
                console.warn("[WEBSOCKET] Unknown message:", data);
        }
    }

// #######################################################################################################
    send(command, data = {}){

        if(!this.socket || this.socket.readyState !== WebSocket.OPEN){
            console.warn("[WEBSOCKET] Not connected");
            return false;
        }

        this.socket.send(JSON.stringify({command, ...data}));

        return true;
    }

// #######################################################################################################
    start(config){
        return this.send("start", {config});
    }

// #######################################################################################################
    pause(){
        return this.send("pause");
    }

// #######################################################################################################
    reset(){
        return this.send("reset");
    }

// #######################################################################################################
    getState(){
        return this.send("getState");
    }

// #######################################################################################################
    onState(callback){
        this.onStateCallback = callback;
    }

// #######################################################################################################
    onFinished(callback){
        this.onFinishedCallback = callback;
    }

// #######################################################################################################
    onReset(callback){
        this.onResetCallback = callback;
    }

// #######################################################################################################
    onConnected(callback){
        this.onConnectedCallback = callback;
    }

// #######################################################################################################
    onDisconnected(callback){
        this.onDisconnectedCallback = callback;
    }
}