import { readFileSync } from "fs";
import * as readLine from "readline"
import EventEmitter from "events";

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function *toGenerator<T>(arr:Array<T>){
    for (let element of arr) {
        yield element;
    }
    return;
}

async function getInput() {
    return new Promise<string>((resolve)=>{
        process.stdin.once("data", (data:Buffer)=>{
            resolve(data.toString())
        })
    })
}

export async function start(file:string){
    var vocabulary:JSON = JSON.parse(readFileSync(file, { encoding: 'utf8', flag: 'r' }));
    
    
    var ansGen = toGenerator(Object.values(vocabulary));
    
    var qestionGen = toGenerator(Object.keys(vocabulary));
    
    process.stdin.resume();
    for(let question of qestionGen)
    {
        console.log(question);
        let asn:string = await getInput();
        console.log("")
        console.log(ansGen.next().value==asn.trim());
    }

    process.stdin.destroy();
}

//start("resources/工学1659661680236.json");