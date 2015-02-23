function extend(receiver, source, namely){
    var i, l;
    if(source instanceof Array){
        i = 0; l = source.length;
        for(; i<l; i++){
            work(source[i]);
        }
    } else {
        work(source);
    }
    function work(obj){
        var i, j, l, name;
        if(namely){
            i = 0; l = namely.length;
            for(; i<l; i++){
                name = namely[i];
                if(obj[name] !== undefined){
                    receiver[name] = obj[name];
                }
            }
        } else {
            for(i in obj){
                if(obj.hasOwnProperty(i)){
                    if(receiver instanceof Array){
                        j = 0; l = receiver.length;
                        for(; j<l; j++){
                            receiver[j][i] = obj[i];
                        }
                    } else {
                        receiver[i] = obj[i];
                    }
                }
            }
        }
    }
    return receiver;
}