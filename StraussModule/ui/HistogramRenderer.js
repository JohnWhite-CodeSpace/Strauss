export class HistogramRenderer{

    constructor(canvasId){
        this.canvas=document.getElementById(canvasId);
        this.ctx=this.canvas.getContext("2d");
    }

    clear(){
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    draw(data){
        const bins=this.createBins(data);
        const bounds=this.getBounds(bins);

        this.clear();
        this.drawGrid(bounds);
        this.drawAxes(bounds);
        this.drawLabels(bins,bounds);
        this.drawBars(bins,bounds);
    }

    createBins(data){
        const maxDegree=Math.max(...data);
        const bins=new Array(maxDegree+1).fill(0);
        data.forEach(degree=>{bins[degree]++;});

        return bins;
    }

    drawGrid(bounds){
        const{leftPadding, rightPadding, topPadding, bottomPadding}=bounds;
        const ctx=this.ctx;
        const width=this.canvas.width;
        const height=this.canvas.height;
        const tickCount=5;
        ctx.strokeStyle=this.getThemeColor("--chart-grid-color");

        for(let i=0;i<=tickCount;i++){
            const y=topPadding+i*(height-topPadding-bottomPadding)/tickCount;
            ctx.beginPath();
            ctx.moveTo(leftPadding,y);
            ctx.lineTo(width-rightPadding,y);
            ctx.stroke();
        }
    }

    drawAxes(bounds){

        const{leftPadding,rightPadding,topPadding,bottomPadding}=bounds;
        const ctx=this.ctx;
        const width=this.canvas.width;
        const height=this.canvas.height;
        const tickCount=5;

        ctx.beginPath();
        ctx.strokeStyle=this.getThemeColor("--chart-axis-color");
        ctx.moveTo(leftPadding,topPadding);
        ctx.lineTo(leftPadding,height-bottomPadding);
        ctx.lineTo(width-rightPadding,height-bottomPadding);
        ctx.stroke();

        for(let i=0;i<=tickCount;i++){
            const x=leftPadding+i*(width-leftPadding-rightPadding)/tickCount;
            ctx.beginPath();
            ctx.moveTo(x,height-bottomPadding-5);
            ctx.lineTo(x,height-bottomPadding+5);
            ctx.stroke();
        }

        for(let i=0;i<=tickCount;i++){
            const y=topPadding+i*(height-topPadding-bottomPadding)/tickCount;
            ctx.beginPath();
            ctx.moveTo(leftPadding-5,y);
            ctx.lineTo(leftPadding+5,y);
            ctx.stroke();
        }
    }

    drawLabels(bins,bounds){
        const{leftPadding, rightPadding, topPadding, bottomPadding,maxCount}=bounds;
        const ctx=this.ctx;
        const width=this.canvas.width;
        const height=this.canvas.height;
        ctx.fillStyle=this.getThemeColor("--chart-label-color");
        ctx.font="11px Arial";
        const tickCount=5;
        
        for(let i=0;i<=tickCount;i++){
            const value=maxCount-i*maxCount/tickCount;
            const y=topPadding+i*(height-topPadding-bottomPadding)/tickCount;
            ctx.fillText(Math.round(value),5,y+4);
        }

        for(let i=0;i<=tickCount;i++){
            const degree=Math.round(i*(bins.length-1)/tickCount);
            const x=leftPadding+i*(width-leftPadding-rightPadding)/tickCount;
            ctx.fillText(degree.toString(),x-5,height-20);
        }
        ctx.fillText("Degree",width/2-20,height-2);
        ctx.save();
        ctx.translate(10, height/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText("Node Count",0,0);
        ctx.restore();
    }

    drawBars(bins,bounds){

        const{leftPadding, rightPadding, topPadding, bottomPadding, maxCount}=bounds;
        const ctx=this.ctx;
        const width=this.canvas.width;
        const height=this.canvas.height;
        const plotWidth=width-leftPadding-rightPadding;
        const plotHeight=height-topPadding-bottomPadding;
        const barWidth=plotWidth/bins.length;
        ctx.fillStyle= this.getThemeColor("--chart-histogram-color");

        for(let i=0;i<bins.length;i++){
            const value=bins[i];
            const barHeight=(value/maxCount)*plotHeight;
            const x=leftPadding+i*barWidth;
            const y=height-bottomPadding-barHeight;
            ctx.fillRect(x,y,barWidth-2,barHeight);
        }
    }

    getBounds(bins){
        const ctx=this.ctx;
        const maxCount=Math.max(...bins);
        const labelWidth=ctx.measureText(maxCount.toString()).width;
        const leftPadding=labelWidth+20;
        const rightPadding=20;
        const topPadding=20;
        const bottomPadding=50;

        return{leftPadding, rightPadding,topPadding,bottomPadding,maxCount};
    }
    getThemeColor(variable){
        const style=getComputedStyle(document.documentElement);
        return style.getPropertyValue(variable);
    }
}