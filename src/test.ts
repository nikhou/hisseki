function *gen(){
    let i:number=0
    while (true) yield i++;
}

let index = gen();