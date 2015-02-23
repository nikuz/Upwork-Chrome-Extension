var jobsCache = {
    get: function(options){
        this.attempt = 1;
        var df = new MyDefer();

        this.request(df, options);

        return df.promise;
    },
    request: function(df, options){
        var that = this;
        extend(options || {}, {
            q: storage.get('feeds')
        });
        proxy.get(options)
            .then(function(data){
                that.response(df, data);
            })
            .rejected(function(err){
                df.reject(err);
            });
    },
    response: function(df, data){
        df.resolve(data);
    },
    update: function(){
        var that = this,
            df = new MyDefer(),
            options = {
                q: storage.get('feeds')
            };

        proxy.update(options)
            .then(function(){
                that.request(df, options);
            })
            .rejected(function(err){
                df.reject(err);
            });

        return df.promise;
    }
};