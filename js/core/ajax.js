var ajax = function(params){
    var request = new XMLHttpRequest,
        method = (params.method || 'GET').toUpperCase(),
        rUrl = params.url,
        dataString = null;

    if(method === 'GET'){
        rUrl += addParamsMarker(rUrl) + paramsSerialise();
    }

    request.open(method, rUrl, params.async || true);

    if(method === 'POST'){
        request.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=utf-8');
        dataString = paramsSerialise();
    }

    if(params.beforeSend){
        params.beforeSend();
    }

    function addParamsMarker(rUrl){
        return (/\?/.test(rUrl) ? '&' : '?');
    }
    function paramsSerialise(){
        var i, dataString = '';

        for(i in params.data){
            if(params.data.hasOwnProperty(i)){
                dataString += i+'='+encodeURI(params.data[i])+'&';
            }
        }
        return dataString.replace(/&$/, '');
    }

    request.send(dataString);

    return {
        xhr: request,
        then: function(callback){
            request.onload = function(){
                var response = request.responseText;
                if(request.status >= 200 && request.status < 400){
                    var type = (params.dataType || 'text').toUpperCase();
                    if(type === 'JSON'){
                        response = JSON.parse(response);
                    }
                }
                callback(response);
            };
        },
        error: function(callback){
            request.onerror = function(err){
                callback(err);
            }
        }
    };
};