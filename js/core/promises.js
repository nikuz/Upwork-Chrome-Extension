var MyDefer = function(){
    var that = this;
    this.resolveCallback = null;
    this.previewCallback = null;
    this.rejectCallback = function(err){
        console.trace(err);
    };

    this.promise = {
        then: function(callback){
            that.resolveCallback = callback;
            return that.promise;
        },
        preview: function(callback){
            that.previewCallback = callback;
            return that.promise;
        },
        rejected: function(callback){
            that.rejectCallback = callback;
        }
    };
    this.resolve = function(data){
        that.tryResolve('resolveCallback', data);
    };
    this.preview = function(data){
        that.tryResolve('previewCallback', data);
    };
    this.reject = function(error){
        that.rejectCallback(error);
    };

    this.tryResolve = function(callbackName, data){
        if(that[callbackName] === null){
            setTimeout(function(){
                that.tryResolve(callbackName, data);
            }, 50);
        } else {
            that[callbackName](data);
        }
    }
};

var MyWhen = function(requests){
    var i = 0, l = requests.length,
        finished = [],
        df = new MyDefer();

    for(; i<l; i++){
        requests[i].then(function(data){
            finished.push(data);
            if(finished.length === l){
                df.resolve(finished);
            }
        }).rejected(function(err){
            df.reject(err);
        });
    }

    return df.promise;
};