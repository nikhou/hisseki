import {start} from "./exam"
import { opendir } from "fs/promises";
import * as yargs from "yargs"
import { Dir } from "fs";

let argv = yargs.argv;

function help(){
    console.log(`Usage: node exam-cli [OPTION]...

Options:
    -l [REGEXP]     list all resourcess
    -e [LIST]       start exam
    -h              help`)
}

async function list() {
    
    let resources:Dir = await opendir("resources")
    for await (const dirent of resources){
        console.log(dirent.name);
    }


}

async function exam(REGEXP?:string) {
    
}

if(argv["l"]){
    list();
}

if(argv["e"]){
    start("resources/"+argv["e"])
}

if(argv["h"])
    help();