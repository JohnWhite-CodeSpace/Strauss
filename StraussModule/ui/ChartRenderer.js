export class ChartRenderer {

constructor(canvasId){
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
}

// #######################################################################################################
    clear(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

// #######################################################################################################
    draw(history, config={}){
        this.clear();
        if(!history || history.length<2){
            return;
        }
        const bounds = this.getChartBounds(history, config);

        this.drawGrid(bounds);
        this.drawAxes(bounds);
        this.drawLabels(history, bounds, config);
        this.drawLine(history, bounds, config);
    }

// #######################################################################################################
    drawTwoLines(history1,history2,config1,config2){
        this.clear();
        const merged=[...history1,...history2];
        const xAccessor=config1.xAccessor || (p=>p.step);
        const maxX=Math.max(...merged.map(xAccessor));
        const bounds=this.getChartBounds(merged,config1);

        this.drawGrid(bounds);
        this.drawAxes(bounds);
        this.drawLabels(merged,bounds,config1,maxX);

        this.drawLine(history1,bounds,config1,maxX);
        this.drawLine(history2,bounds,config2,maxX);
    }

// #######################################################################################################
    drawLine(history, bounds, config ,externalMaxX=null){
        const {leftPadding, rightPadding, topPadding, bottomPadding, minY, maxY} = bounds;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const xAccessor = config.xAccessor || (p => p.step);
        const maxX=externalMaxX ?? Math.max(...history.map(xAccessor));

        ctx.beginPath();

        for(let i = 0; i < history.length; i++){
            const point = history[i];
            const x = leftPadding + (xAccessor(point) / maxX) * (width - leftPadding - rightPadding);
            const y = height - bottomPadding - ((point.value - minY) / (maxY - minY + 1e-9)) * (height - topPadding - bottomPadding);
            if(i === 0){
                ctx.moveTo(x, y);
            }
            else{
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = this.getThemeColor(config.colorVar);
        ctx.lineWidth = 2;
        ctx.lineJoin="round";
        ctx.lineCap="round";
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.getThemeColor(config.colorVar);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

// #######################################################################################################
    drawAxes(bounds){
        const {leftPadding, rightPadding, topPadding, bottomPadding} = bounds;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const tickCount = 5;

        ctx.beginPath();
        ctx.strokeStyle = this.getThemeColor("--chart-axis-color");
        ctx.lineWidth = 1.5;
        ctx.moveTo(leftPadding, topPadding);
        ctx.lineTo(leftPadding, height - bottomPadding);
        ctx.lineTo(width - rightPadding, height - bottomPadding);
        ctx.stroke();

        for(let i = 0; i <= tickCount; i++){
            const y = topPadding + i * (height - topPadding - bottomPadding) / tickCount;
            ctx.beginPath();
            ctx.moveTo(leftPadding - 5, y);
            ctx.lineTo(leftPadding + 5, y);
            ctx.stroke();
        }
        for(let i = 0; i <= tickCount; i++){
            const x = leftPadding + i * (width - leftPadding - rightPadding) / tickCount;
            ctx.beginPath();
            ctx.moveTo(x, height - bottomPadding - 5);
            ctx.lineTo(x, height - bottomPadding + 5);
            ctx.stroke();
        }
    }

// #######################################################################################################
    drawGrid(bounds){
        const {leftPadding, rightPadding, topPadding, bottomPadding} = bounds;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const tickCount = 5;

        ctx.strokeStyle = this.getThemeColor("--chart-grid-color");

        for(let i = 0; i <= tickCount; i++){
            const y = topPadding + i * (height - topPadding - bottomPadding) / tickCount;

            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(width - rightPadding, y);
            ctx.stroke();
        }

        for(let i = 0; i <= tickCount; i++){
            const x = leftPadding + i * (width - leftPadding - rightPadding) / tickCount;

            ctx.beginPath();
            ctx.moveTo(x, topPadding);
            ctx.lineTo(x, height - bottomPadding);
            ctx.stroke();
        }
    }

// #######################################################################################################
    drawLabels(history, bounds, config,externalMaxX=null){
        const {leftPadding, rightPadding, topPadding, bottomPadding, minY, maxY} = bounds;
        const formatter = config.formatter || this.formatValue;
        const xFormatter = config.xFormatter || this.formatValue;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const xAccessor = config.xAccessor || (p => p.step);
        const maxX=externalMaxX ?? Math.max(...history.map(xAccessor));
        const tickCount = 5;

        ctx.fillStyle = this.getThemeColor("--chart-label-color");
        ctx.font = "11px Arial";

        for(let i = 0; i <= tickCount; i++){
            const value = maxY - i * (maxY - minY) / tickCount;
            const y = topPadding + i * (height - topPadding - bottomPadding) / tickCount;
            const tickTextX = leftPadding - 35;
            ctx.fillText(formatter.call(this, value), tickTextX, y + 4);
        }

        for(let i = 0; i <= tickCount; i++){
            const step = i * maxX / tickCount;
            const x = leftPadding + i * (width - leftPadding - rightPadding) / tickCount;

            ctx.fillText(xFormatter.call(this, step), x - 12, height - 20);
        }

        ctx.fillText(config.xLabel || "Monte Carlo Steps", width / 2 - 45, height - 2);

        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(config.yLabel, 0, 0);
        ctx.restore();
    }

// #######################################################################################################
    getChartBounds(history, config){
        const formatter = config.formatter || this.formatValue;
        const ctx = this.ctx;
        const values =history.map(p => p.value);
        const minY = Math.min(...values);
        const maxY = Math.max(...values);
        const maxWidth =Math.max(ctx.measureText(formatter.call(this, maxY)).width, ctx.measureText(formatter.call(this, minY)).width);
        const leftPadding = maxWidth +30;
        const rightPadding =20;
        const topPadding = 20;
        const bottomPadding = 50;

        return {leftPadding, rightPadding, topPadding, bottomPadding, minY, maxY};
    }

// #######################################################################################################
    formatValue(value){

        if(Math.abs(value)>= 1000000){
            return (value / 1000000).toFixed(1) + "M";
        }
        if(Math.abs(value)>= 1000){
            return (value / 1000).toFixed(1) + "k";
        }

        return value.toFixed(1);
    }
    
// #######################################################################################################
    getThemeColor(variable){
        const style =getComputedStyle(document.documentElement);
        return style.getPropertyValue(variable);
    }

// #######################################################################################################
    formatFloat(value){
        return value.toFixed(2);
    }
}