var oDesk = {
    oDeskAPIUrl: 'https://www.odesk.com',
    oauth: null,
    config: function(params){
        this.oauth = OAuth({
            consumer: {
                'public': params.key,
                'secret': params.secret
            }
        })
    },
    attemptLimit: 5,
    request: function(params){
        var that = this,
            df = new MyDefer();

        params.attempt = 0;

        if(params.isInner){
            request(params);
        } else {
            this.access(function(err){
                if(err){
                    df.reject(err);
                } else {
                    request(params);
                }
            });
        }

        function request(params){
            var method = params.method || 'GET',
                request_data = {
                    url: that.oDeskAPIUrl+params.url,
                    method: method,
                    data: extend(params.data || {}, storage.get('token') && {'oauth_token': storage.get('token')})
                };

            var req = ajax({
                url: request_data.url,
                data: that.oauth.authorize(request_data, {
                    'secret': storage.get('token_secret')
                }),
                method: method,
                dataType: params.dataType,
                beforeSend: params.beforeSend
            });

            req.then(function(data){
                df.resolve(data);
            });
            req.error(function(err){
                if(params.isInner && params.attempt !== that.attemptLimit){
                    params.attempt++;
                    request(params);
                } else {
                    df.reject(err);
                }
            });
        }

        return df.promise;
    },
    access: function(callback){
        var access = storage.get('access');
        if(access){
            callback();
        } else {
            this.accessRequest()
                .then(function(){
                    if(!storage.get('access')){
                        callback('error');
                    } else {
                        callback();
                    }
                })
                .rejected(function(err){
                    callback(err);
                });
        }
    },
    accessRequest: function(){
        var that = this,
            df = new MyDefer();

        this.accessRevoke();

        this.verifierRequest()
            .then(function(){
                if(!storage.get('verifier')) return df.reject();

                that.request({
                    url: '/api/auth/v1/oauth/token/access',
                    method: 'POST',
                    data: {
                        'oauth_token': storage.get('token'),
                        'oauth_verifier': storage.get('verifier')
                    },
                    additional: {
                        'secret': storage.get('token_secret')
                    },
                    isInner: true
                }).then(function(data){
                    that.store(['token', 'token_secret'], data);
                    that.store('token', 'access', data);
                    df.resolve();
                    chrome.tabs.create({ 'url': chrome.runtime.getURL('popup.html?initial=true') });
                }).rejected(function(err){
                    df.reject(err);
                });
            })
            .rejected(function(err){
                df.reject(err);
            });

        return df.promise;
    },
    accessRevoke: function(){
        ['token', 'token_secret', 'verifier'].forEach(function(i){
            storage.clear(i);
        });
    },
    verifierPage: 'verifierRequest.html',
    verifierRequest: function(){
        var that = this;

        this.verifierDf = new MyDefer();

        this.tokenRequest()
            .then(function(){
                if(!storage.get('token')) return that.verifierDf.reject();

                chrome.tabs.create({ 'url': chrome.runtime.getURL(that.verifierPage+'?request=1') });
            })
            .rejected(function(err){
                that.verifierDf.reject(err);
            });

        return this.verifierDf.promise;
    },
    verifierRequestDone: function(url){
        this.store('verifier', url);
        this.verifierDf.resolve();
    },
    verifierRedirectURL: function(){
        return this.oDeskAPIUrl+'/services/api/auth?oauth_token='+storage.get('token');
    },
    tokenRequest: function(){
        var that = this,
            df = new MyDefer();

        this.request({
            url: '/api/auth/v1/oauth/token/request',
            method: 'POST',
            data: {
                'oauth_callback': chrome.runtime.getURL(this.verifierPage)
            },
            isInner: true
        }).then(function(data){
            that.store(['token', 'token_secret'], data);
            df.resolve();
        }).rejected(function(err){
            df.reject(err);
        });

        return df.promise;
    },
    store: function(name, targetName, data){
        if(!data){
            data = targetName;
            targetName = name;
        }
        data = this.oauth.deParam(data);
        if(name instanceof Array){
            name.forEach(function(val, key){
                set(targetName[key], 'oauth_'+name[key]);
            });
        } else {
            set(targetName, 'oauth_'+name);
        }
        
        function set(name, value){
            if(data[value]){
                storage.set(name, data[value]);
            }
        }
    }
};