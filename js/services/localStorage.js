var storage = {
    get: function(name){
        var data = localStorage[name];
        try {
            data = JSON.parse(data);
        } catch(e){}

        return data;
    },
    set: function(name, data){
        localStorage[name] = typeof data === 'object' ? JSON.stringify(data) : data;
    },
    check: function(name){
        return !!localStorage[name];
    },
    clear: function(name){
        delete localStorage[name];
    }
};