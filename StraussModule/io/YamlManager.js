import * as yaml from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm";

export class YamlManager {

    save(config){
        const yamlText = yaml.dump(config);
        const blob = new Blob([yamlText], {type:"text/yaml"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "strauss_preset.yaml";
        a.click();
        URL.revokeObjectURL(url);
    }

    load(file){

        return new Promise((resolve,reject)=>{
            const reader = new FileReader();
            reader.onload = ()=>{
                try{
                    const config = yaml.load(reader.result);
                    resolve(config);
                }
                catch(error){
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    getPresetName(){
        return document
            .getElementById("presetName")
            .value;
    }
}