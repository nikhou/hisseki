import { snakeGen, wikiGen, getPair } from "./list";
import * as yargs from "yargs"
import * as fs from "fs"
import { Writable } from "stream";

let out:Writable = process.stdout

function wrteArrayAsJSON(arr:string[][]){
    let outJSON:object = {};
    arr.forEach((pair:string[]) => {
        outJSON[pair[0]]=pair[1];
    });
    out.write(JSON.stringify(outJSON));
    out.end();
    process.exit(0);
}

function help(){
    console.log(`Useage: node list-cli [OPTION]... [WORD]...
    creste list for vocabu;ary practice

        --out [FILE]        choode own file for output
        --type [TYPE]       choose mothod snake/wiki
        --name [NAME]       name for file in resources dir
        --length [LENGTH]   length og list`)
        process.exit(0);
}

let argv = yargs.argv;

if(argv._.length==0){
    help();
}

if(argv["out"]!=undefined){
    out = fs.createWriteStream("out");
} 
if(argv["name"]!=undefined){
    out = fs.createWriteStream("resources/"+argv["name"]+".json")
}
else {
    out = fs.createWriteStream("resources/"+argv._[0]+Date.now()+".json")
}

if(argv["length"]==undefined)
    argv["length"]=16;

switch (argv["type"]){
    case "wiki":
        wikiGen(getPair(argv._[0])[1], argv["length"]).then(wrteArrayAsJSON)
        break;
    case "snake":
        snakeGen(getPair(argv._[0])[1], argv["length"]).then(wrteArrayAsJSON)
        break;
    default:
        help;
}