export class CommandParser{

// #######################################################################################################
    parse(input){
        const parts = input.trim().split(" ");
        return{command: parts[0], args: parts.slice(1)};
    }
}