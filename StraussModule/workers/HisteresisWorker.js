import { Graph } from "../core/Graph.js";
import { MonteCarlo } from "../core/MonteCarlo.js";
import { StraussModel } from "../core/StraussModel.js";

function fastMonteCarlo(graph,model,steps){

    for(let i=0;i<steps;i++){

        const [a,b]=graph.getRandomPair();

        const delta=model.computeDelta(graph,a,b);

        if(delta>=0 || Math.random()<Math.exp(delta)){
            graph.toggleEdge(a,b);
        }
    }
}

self.onmessage=function(event){

    const {nodes,theta, sigmaStart, sigmaEnd, sigmaStep, stepsPerSigma}=event.data;
    let graph=new Graph(nodes);
    let forward=[];
    let backward=[];

    for(let sigma=sigmaStart;sigma<=sigmaEnd;sigma+=sigmaStep){
        let model=new StraussModel(theta,sigma);
        fastMonteCarlo(graph,model,stepsPerSigma);
        forward.push({sigma:sigma, value:graph.countEdges()});
        self.postMessage({type:"progress", sigma});
    }

    for(let sigma=sigmaEnd;sigma>=sigmaStart;sigma-=sigmaStep){
        let model=new StraussModel(theta,sigma);
        fastMonteCarlo(graph,model,stepsPerSigma);
        backward.push({sigma:sigma, value:graph.countEdges()});

        self.postMessage({type:"progress",sigma});
    }
    self.postMessage({type:"done",forward,backward});
}