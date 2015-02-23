var proxy = {
    get: function(options){
        var that = this,
            df = new MyDefer();

        oDesk.access(function(){
            var curCache = that.cacheCheck(options.q);

            if(curCache.valid){
                that.request(df, options);
            } else {
                if(curCache.jobs){
                    that.request(df, options, true);
                    that.cacheUpdate(options.q);
                }
                that.cache(options)
                    .then(function(){
                        that.request(df, options);
                    })
                    .rejected(function(err){
                        df.reject(err);
                    });
            }
        });
        return df.promise;
    },
    attemptLimit: 5,
    request: function(df, options, preview){
        var that = this,
            settings = pageSettings.get(),
            curCache = this.cacheGet(options.q).jobs,
            jobsInFolders = this.jobsInFoldersGet(curCache, options.addMore),
            i = 0, l = curCache.length,
            result = [];

        for(; i<l; i++){
            if(!jobsInFolders.length || !this.jobInFolder(curCache[i], jobsInFolders)){
                result.push(curCache[i]);
            }
            if(result.length === settings.jobsPerPage) break;
        }

        preview && df.preview(result);
        if(curCache.length > settings.jobsPerPage && result.length < settings.jobsPerPage){
            options.attempt = options.attempt || 1;
            options.attempt++;
            if(options.attempt < that.attemptLimit){
                this.cache(options, 'extend')
                    .then(function(){
                        that.request(df, options);
                    })
                    .rejected(function(err){
                        df.reject(err);
                    });
            } else {
                df.resolve(result);
            }
        } else {
            result = result.sort(this.sort);
            !preview && df.resolve(result);
        }
    },
    update: function(options){
        var df = new MyDefer();

        this.cacheUpdate(options.q);
        df.resolve();

        return df.promise;
    },
    jobsInFoldersGet: function(curCache, inboxIncluded){
        var folders = ['favorites', 'trash'],
            i, l, folder,
            result = [];

        if(inboxIncluded){
            folders.push('inbox');
        }
        i = 0; l = folders.length;
        for(; i<l; i++){
            folder = storage.get(folders[i]);
            if(folder && folder.length){
                result = result.concat(folder);
            }
        }

        return result;
    },
    jobInFolder: function(jobItem, jobsInFolders){
        var i = 0, l = jobsInFolders.length;
        for(; i<l; i++){
            if(jobsInFolders[i].id === jobItem.id) return true;
        }
    },
    requestServer: function(options){
        var df = new MyDefer();

        this.requestServerGet(df, options);

        return df.promise;
    },
    requestServerGet: function(df, options){
        var requestDf = oDesk.request({
            url: '/api/profiles/v2/search/jobs.json',
            dataType: 'JSON',
            data: options
        });

        requestDf.then(function(data){
            df.resolve(data);
        });

        requestDf.rejected(function(){
            df.reject();
        });
    },
    requestDataGet: function(options){
        var settings = pageSettings.get();
        return {
            'q': options.q,
            'budget': '['+settings.budgetFrom+' TO '+settings.budgetTo+']',
            'days_posted': settings.daysPosted,
            'duration': this.getVal(settings.duration),
            'job_type': this.getVal(settings.jobType),
            'workload': this.getVal(settings.workload)
        };
    },
    getVal: function(val){
        val = val ? val.toLocaleLowerCase().replace(' ', '_') : '';
        return val === 'all' ? '' : val;
    },
    cache: function(options, extend){
        var df = new MyDefer();

        this.cacheFill(df, options, extend);

        return df.promise;
    },
    cacheCountPerRequest: 100,
    cacheCountLimit: 500, // must be 500
    cacheCountExtend: 200, // must be 200
    cacheFill: function(df, options, toExtend){
        var curCache = this.cacheGet(options.q),
            curCacheLen = curCache ? curCache.jobs.length : 0,
            countLimit = (curCacheLen || this.cacheCountLimit) + (toExtend ? this.cacheCountExtend : 0);

        if(!curCache || curCache.jobs.length < countLimit){
            var that = this,
                l = (countLimit - curCacheLen)/this.cacheCountPerRequest,
                i = 0,
                requests = [];

            for(; i<l; i++){
                requests.push(
                    this.requestServer(extend({
                        paging: (curCacheLen + this.cacheCountPerRequest * i)+';'+ this.cacheCountPerRequest
                    }, this.requestDataGet(options)))
                );
            }
            new MyWhen(requests)
                .then(function(data){
                    var result = [], i = 0, l = data.length;
                    for(; i<l; i++){
                        if(data[i].jobs){
                            result = result.concat(that.cacheObfuscator(data[i].jobs));
                        }
                    }
                    that.cacheSet(options, result);
                    df.resolve();
                })
                .rejected(function(err){
                    df.reject(err);
                });
        } else {
            df.resolve();
        }
    },
    cacheGet: function(q){
        var cacheName = this.cacheNameGet(q);
        return storage.get('cache_'+cacheName);
    },
    cacheSet: function(options, data){
        var curCache = this.cacheGet(options.q),
            cacheName = this.cacheNameGet(options.q);

        curCache = (curCache ? curCache.jobs : []).concat(data).sort(this.sort);

        storage.set('cache_'+cacheName, {
            created: Date.now(),
            jobs: curCache
        });
    },
    cacheJobsFields: [
        'id',
        'new',
        'budget',
        'date_created',
        'duration',
        'job_type',
        'skills',
        'title',
        'url',
        'workload'
    ],
    cacheObfuscator: function(jobsList){
        var that = this;
        jobsList.forEach(function(item){
            for(var i in item){
                if(item.hasOwnProperty(i) && that.cacheJobsFields.indexOf(i) === -1){
                    delete item[i];
                }
            }
        });
        return jobsList;
    },
    cacheUpdate: function(q){
        var cacheName = this.cacheNameGet(q);
        storage.clear('cache_'+cacheName);
    },
    cacheAddNew: function(){
        var settings = pageSettings.get(),
            that = this,
            options = {
                q: storage.get('feeds')
            };

        oDesk.access(function(){
            var request = that.requestServer(extend({
                paging: '0;'+ that.cacheCountPerRequest
            }, that.requestDataGet(options)));
            request.then(function(data){
                data = that.cacheObfuscator(data.jobs);
                var curCache = that.cacheGet(options.q),
                    i = 0, l = data.length,
                    limit_len, result = [];

                curCache = curCache ? curCache.jobs : [];
                limit_len = curCache.length || that.cacheCountLimit;

                for(; i<l; i++){
                    if(!curCache.length || !that.jobInFolder(data[i], curCache)){
                        result.push(extend(data[i], {new: 1}));
                    }
                }
                if(result.length){
                    that.cacheSet(options, result);
                    curCache.splice(limit_len-result.length);

                    var inbox = storage.get('inbox');
                    if(inbox){
                        var popup = chrome.extension.getViews({type: 'popup'})[0];

                        inbox = inbox.concat(result).sort(that.sort);
                        if(!popup){
                            inbox.splice(settings.jobsPerPage);
                        }
                        storage.set('inbox', inbox);
                    }
                }
            });
        });
    },
    cacheCheckNew: function(){
        var feeds = storage.get('feeds');
        if(!feeds) return;

        var curCache = this.cacheGet(feeds);
        if(!curCache) return;
        curCache = curCache.jobs;

        var i = 0, l = curCache.length,
            result = [];

        for(; i<l; i++){
            if(curCache[i].new){
                result.push(curCache[i]);
            }
        }

        return result;
    },
    cacheCheck: function(q){
        var curCache = this.cacheGet(q),
            response = {
                valid: true
            };

        if(!curCache){
            response.valid = false;
        } else {
            response.valid = (Date.now() - curCache.created) /1000/60/60 < 2; // valid if less than two hours after update
            response.jobs = true;
        }
        return response;
    },
    cacheNewMakeViewed: function(ids, folderName){
        ids = typeof ids === 'object' ? ids : [ids];
        folderName = folderName || 'inbox';

        var feeds = storage.get('feeds'),
            curCache = this.cacheGet(feeds),
            folder = storage.get(folderName),
            cacheName = this.cacheNameGet(feeds),
            i = 0, l = curCache.jobs.length;

        curCache = curCache.jobs;

        for(; i<l; i++){
            if(ids.indexOf(curCache[i].id) !== -1){
                curCache[i].new = 0;
            }
        }
        i = 0; l = folder.length;
        for(; i<l; i++){
            if(ids.indexOf(folder[i].id) !== -1){
                folder[i].new = 0;
            }
        }

        storage.set('cache_'+cacheName, {
            created: Date.now(),
            jobs: curCache
        });
        storage.set(folderName, folder);

        watcher.newJobsBadgeUpdate();
        return true;
    },
    cacheLengthLimit: 10,
    cacheLengthCheck: function(){
        var ls = localStorage, i,
            count = 0,
            curFeed = storage.get('feeds');

        curFeed = this.cacheNameGet(curFeed || '');

        for(i in ls){
            if(ls.hasOwnProperty(i)){
                if(i.indexOf('cache_') === 0){
                    count++;
                    if(count > this.cacheLengthLimit && i !== 'cache_'+curFeed){
                        delete ls[i];
                    }
                }
            }
        }
    },
    cacheNameGet: function(name){
        return name.replace(/\s/g, '_');
    },
    sort: function(a, b){
        var prop = 'date_created';
        if(a[prop] > b[prop]){
            return -1;
        } else if(a[prop] < b[prop]){
            return 1;
        } else {
            return 0;
        }
    }
};