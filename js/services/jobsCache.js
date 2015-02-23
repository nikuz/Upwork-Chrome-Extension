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
                that.response(df, options, data);
            })
            .rejected(function(err){
                df.reject(err);
            });
    },
    response: function(df, options, data){
        var popup = chrome.extension.getViews({type: 'popup'})[0],
            inbox = storage.get('inbox') || [];

        if(!options.addMore){
            inbox = [];
        }
        storage.set('inbox', inbox.concat(data));
        if(popup){
            df.resolve(data);
        } else {
            df.reject();
            if(storage.get('initial')){
                storage.clear('initial');
                chrome.tabs.create({ 'url': chrome.runtime.getURL('popup.html?initial=true') });
            }
        }
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