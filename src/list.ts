import JishoAPI, {JishoAPIResult, KanjiParseResult, JishoResult} from "unofficial-jisho-api"
import https, { RequestOptions } from "https"
import { IncomingMessage } from "http";

const jisho = new JishoAPI();

async function getWikiPage(url:string, page:string, option:string=''):Promise<JSON>{
    return new Promise<JSON>((resolve)=>{
        https.get(url+"w/api.php?action=parse&page="+page+"&format=json"+option, (res:IncomingMessage)=>{
            let buffer:string="";
            res.on("data",(dataa:Buffer)=>buffer=buffer+dataa.toString())
            res.on("end", ()=> {
                resolve(JSON.parse(buffer).parse);
            })
        });
    })
}
//for prevent 429
//TODO: find faster dictionary
async function gentleSearch(words:string[], callback?:(result:JishoResult[])=>void):Promise<JishoResult[]> {
    let results:JishoResult[] = []
    for (let word of words){
        let respose:JishoAPIResult = await jisho.searchForPhrase(word);
        if (respose.meta.status!=200) console.debug(respose.meta.status);
        if (callback!=undefined)
            callback(respose.data);
        results.push(respose.data[0]);
        console.debug(word);
    }
    return results;
}

async function getPairFromJapanese(word: string):Promise<[string, string]> {
    let result:JishoResult[] = (await jisho.searchForPhrase(word)).data
    result=result.filter((data:JishoResult)=>{return data.is_common})
    
    return new Promise<[string, string]>((resolve)=>{
        resolve([, word])
    })
}

export async function getPair(word: string):Promise<[string, string]>{
    let result:JishoResult[] = (await jisho.searchForPhrase(word)).data
    result=result.filter((data:JishoResult)=>{return data.is_common})
    return new Promise<[string, string]>((resolve)=>{
        resolve([word, result[0].slug])
    })
}

async function genListFromEmglish(words:Array<string>) {
    let list : Promise<[string, string]>[] = words.map((word:string)=>{
        return getPair(word);
    })
    return Promise.all(list);
}


/** This function generates "word snake" style list.
 * 
 * @param  {string} seed first
 * @param  {number} length
 * @param  {Array<string>} usedKanji?
 * @returns Promise
 */
export async function snakeGen(seed:string, length:number, usedKanji?:Array<string>):Promise<Array<Array<string>>> {
    let results:JishoResult[] = (await jisho.searchForPhrase(seed)).data;

    // remove data thats main form does not contain seed
    results=results.filter((data:JishoResult)=>data.slug.includes(seed));

    if (usedKanji!=undefined){
        let filterd:JishoResult[] = results.filter((data:JishoResult)=>usedKanji.some((kanji)=>!data.slug.includes(kanji)));
        if (filterd.length==0) return [];

        results=filterd;
        usedKanji.push(seed);
    }

    if (usedKanji==undefined) usedKanji=[seed];

    if (length==1){
        let filterd:JishoResult[] = results.filter((data:JishoResult)=>{return data.is_common});
        if(filterd.length>0) 
            results=filterd;
        let finalResult:JishoResult = results[Math.floor(Math.random()*results.length)];
        let fianPair=[finalResult.senses[0].english_definitions[0], finalResult.slug];
        return [fianPair]
    }

    // lookig for valid series
    let filterd:JishoResult[] = results.filter((data:JishoResult)=>{return data.is_common});
    if(filterd.length>0) 
    {
        let list:Array<Array<string>>=[];
        let result:JishoResult;
        while(list.length==0 && filterd.length > 0)
        {
            let randomIndex:number = Math.floor(Math.random()*filterd.length);
            result = filterd.splice(randomIndex, 1)[0];

            let randomKanjis:string[] = result.slug.replace(seed, '').match(/[\u4e00-\u9faf]/g);
            if(randomKanjis==null) continue;

            let randomKanji:string = randomKanjis[Math.floor(Math.random()*randomKanjis.length)];
            list = list.concat(await snakeGen(randomKanji, length-1, usedKanji))
        }
        list.push([result.senses[0].english_definitions[0], result.slug])
        return list
    }
    // if no common words was found, other can be us
    {
        let list:Array<Array<string>>=[];
        let result:JishoResult;
        while(list.length==0 && results.length > 0)
        {
            let randomIndex:number = Math.floor(Math.random()*results.length);
            result = results.splice(randomIndex, 1)[0];

            let randomKanjis:string[] = result.slug.replace(seed, '').match(/[\u4e00-\u9faf]/g);
            if(randomKanjis==null) continue;

            let randomKanji:string = randomKanjis[Math.floor(Math.random()*randomKanjis.length)];
            list = list.concat(await snakeGen(randomKanji, length-1, usedKanji))
        }
        list.push([result.senses[0].english_definitions[0], result.slug])
        return list
    }
}


export async function wikiGen(単語:string, length:number, usedWords?:string[]):Promise<Array<Array<string>>> {
    let list:Array<Array<string>> = [];
    
    let pageData:JSON = await getWikiPage("https://ja.wikipedia.org/", 単語);

    let links:JSON[] = pageData["links"].filter((value:JSON)=>{return value["exists"]!=undefined && value["ns"]==0 })

    let words:string[] = links.map((l:JSON)=>{
        if (l["*"].match(/[0-9]+/)!=null) 
            return null;
        return l["*"].match(/[\u4e00-\u9faf]+/)
    }).filter((value:RegExpMatchArray)=>{
        if(value==null)
            return false;
        if(value[0].length>2) // if word is log it's usualy proper noun
            return false;
        return true;
    }).filter((value:RegExpMatchArray, i:number, arr:RegExpMatchArray[])=>{
        if(i!=arr.findIndex((val:RegExpMatchArray)=>val[0]==value[0]))
            return false;
        return true;
    }).map((value:RegExpMatchArray)=>value[0])

    let results:JishoResult[] = (await gentleSearch(words ));
    results = results.filter((res:JishoResult)=>res!=undefined).filter((res:JishoResult)=>res.is_common);

    for (let i = 0; i < length; i++){
        let index:number = Math.floor(Math.random()*results.length);
        let res:JishoResult = results.splice(index, 1)[0];
        list.push([res.senses[0].english_definitions[0], res.slug])
    }

    return list;
}

async function genFromKanji(kanjis:string[]) {
    let usedKanji:string[] 
}
