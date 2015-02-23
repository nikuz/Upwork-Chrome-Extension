chrome.runtime.getBackgroundPage(function(bgPage){
    bgPage.watcher.newJobsBadgeReset();
});
document.addEventListener('DOMContentLoaded', function(){
    if(window.innerWidth > 800){
        document.getElementById('wrap').className += ' pageWideMode';
    }
});

myApp.controller('wrap', ['$scope', 'myPageMode', function($scope, myPageMode){
    $scope.curFolder = 'inbox';
    var localInbox = storage.get($scope.curFolder);
    if(localInbox){
        myPageMode.add('data');
    }
    $scope.localInbox = localInbox;

    var feeds = storage.get('feeds');
    $scope.feeds = feeds;
    if(!feeds){
        myPageMode.add('init');
    }
    $scope.pageSettings = pageSettings.get();

    var location = window.location.search;
    if(location.lastIndexOf('initial') !== -1){
        myPageMode.add('extraInitial');
    }
}]);

myApp.controller('jobsList', ['$scope', 'mySharedService', 'myPageMode', 'myScrollAnimate', 'myJobsFolders', 'myJobsPager', 'myJobsListHeight', function($scope, mySharedService, myPageMode, myScrollAnimate, myJobsFolders, myJobsPager, myJobsListHeight){
    $scope.$on('handleBroadcast', function(){
        switch(mySharedService.message){
            case 'feeds added':
                storage.get('feeds') && jobsGet();
                break;
            case 'folder changed':
                folderChanged(mySharedService.value);
                break;
            case 'jobs select all':
                selectAllJobs(mySharedService.value);
                break;
            case 'move jobs to folder':
                moveJobsToFolder(mySharedService.value);
                break;
            case 'settings update':
                storage.get('feeds') && jobsGet(null, 'update needed');
                break;
            default:
        }
    });

    var localInbox = $scope.$parent.localInbox,
        settings = $scope.$parent.pageSettings;

    if(localInbox){
        myJobsPager(localInbox, settings.jobsPerPage);
        $scope.jobList = localInbox;
        myJobsListHeight();
        makeViewed();
    } else if(storage.get('feeds')){
        jobsGet();
    }

    function jobsGet(addMore, updateNeeded){
        myPageMode.add('load');
        chrome.runtime.getBackgroundPage(function(bgPage){
            var jobsRequest;
            if(updateNeeded){
                jobsRequest = bgPage.jobsCache.update();
            } else {
                jobsRequest = bgPage.jobsCache.get({
                    'addMore': addMore
                });
            }
            jobsRequest.preview(function(data){
                myPageMode.add('load');
                response(data, 'preview');
            });
            jobsRequest.then(function(data){
                response(data, null, addMore);
            });
            jobsRequest.rejected(function(err){
                myPageMode.remove('load');
                myPageMode.add('error');
            });
        });
    }

    function response(data, preview, addMore){
        !preview && myPageMode.remove('load');
        if(!localStorage) return;

        var result, inbox;
        if(!data.length){
            if(!addMore){
                storage.clear('inbox');
                myPageMode.set('empty');
            } else {
                myPageMode.add('full');
            }
        } else {
            myPageMode.remove('empty');
            myPageMode.remove('full');
            myPageMode.remove('init');
            myPageMode.add('data');

            inbox = storage.get('inbox') || [];
            if(!addMore){
                inbox = [];
            }
            result = inbox.concat(data);
            myJobsPager(result, settings.jobsPerPage);
            $scope.jobList = result;
            myJobsListHeight();

            storage.set('inbox', inbox.concat(data));
        }

        $scope.safeApply();
        makeViewed();
        if(addMore){
            myScrollAnimate.animate('#page_'+(myJobsPager.count($scope.jobList)), '#jobsList', 105);
        } else {
            myScrollAnimate.top('#jobsList');
        }
    }

    $scope.moreJobsGet = function(){
        if(!myPageMode.has('load')){
            jobsGet('add more');
        }
    };

    function folderChanged(folder){
        var curFolder = $scope.$parent.curFolder,
            jobsList = storage.get(curFolder) || [];

        if(!jobsList.length && curFolder !== 'inbox'){
            folder += ' job_list_empty';
        }
        $scope.jobListClass = folder;

        jobsList = myJobsPager(jobsList, settings.jobsPerPage);
        $scope.jobList = jobsList;
        myJobsListHeight();
        myScrollAnimate.top('#jobsList');
    }

    function selectAllJobs(checked){
        angular.forEach($scope.jobList, function(item){
            item.selected = checked;
        });
    }
    function moveJobsToFolder(folder){
        var jobList = myJobsFolders.move($scope.jobList, folder, $scope.$parent.curFolder);
        if(jobList){
            jobList = myJobsPager(jobList, settings.jobsPerPage);
            $scope.jobList = jobList;
            myJobsListHeight();
        }
    }

    function newJobsCheck(){
        chrome.runtime.getBackgroundPage(function(bgPage){
            var newJobs = bgPage.proxy.cacheCheckNew(),
                inbox = storage.get('inbox');

            if(!newJobs.length) return;
            inbox = myJobsFolders.add(inbox, newJobs, 'inbox');
            myJobsPager(inbox, settings.jobsPerPage);
            $scope.jobList = inbox;
            myJobsListHeight();
            $scope.safeApply();
        });
    }

    function makeViewed(){
        chrome.runtime.getBackgroundPage(function(bgPage) {
            setTimeout(function () {
                $scope.jobList.forEach(function (item) {
                    item.new = 0;
                });
                bgPage.proxy.cacheNewMakeViewed($scope.jobList);
            }, 100);
        });
    }

    window.addEventListener('message', function(e){
        if(e.data === 'newJobs'){
            newJobsCheck();
        }
    }, false);

    window.onunload = function(){
        var inbox = storage.get('inbox');
        if(inbox){
            myJobsFolders.checkLimit(inbox, 'inbox');
            storage.set('inbox', inbox);
        }
    };
}]);

myApp.controller('manager', ['$scope', 'mySharedService', 'myPageMode', function($scope, mySharedService, myPageMode){
    $scope.$on('handleBroadcast', function(){
        if(mySharedService.message === 'folder changed'){
            $scope.selectAllModel = false;
        }
    });
    $scope.settingsShow = function(){
        myPageMode.toggle('settings');
    };
    $scope.feedsValue = $scope.$parent.feeds;
    $scope.feedsSubmit = function(value){
        if(!myPageMode.has('load')){
            value = value ? value.trim() : '';
            if(value.length !== 0){
                storage.set('feeds', feedEscape(value));
                mySharedService.say('feeds added');
            }
        }
    };

    function feedEscape(val){
        return val.replace(/\/|\"|\'|\`|\^|\&|\$|\%|\*|\(|\)|\[|\]|\{|\}|\?|\;|\:|\<|\>|\+|\=|\#|\@|\!/g, '').replace(/\s+/g, ' ');
    }

    $scope.selectAll = function(checked){
        mySharedService.say('jobs select all', checked);
    };
    $scope.moveJobsToFolder = function(folder){
        $scope.selectAllModel = false;
        mySharedService.say('move jobs to folder', folder);
    };
}]);

myApp.controller('jobsFolders', ['$scope', '$element', 'mySharedService', function($scope, $element, mySharedService){
    $scope.folderChange = function($event){
        var folder = $event.currentTarget.getAttribute('data-value');
        $scope.$parent.curFolder = folder;
        menuMakeCurrent(folder);
        mySharedService.say('folder changed', 'folder_'+folder);
    };

    var menuItems = angular.element($element)[0];
    function menuMakeCurrent(curFolder){
        var items = menuItems.querySelectorAll('.jf_item');
        Array.prototype.forEach.call(items, function(item){
            var folder = item.getAttribute('data-value'),
                cl = 'selected';

            item = angular.element(item);
            if(folder === curFolder){
                item.addClass(cl);
            } else {
                item.removeClass(cl);
            }
        });
    }
}]);

myApp.controller('settings', ['$scope', 'mySharedService', 'myPageMode', function($scope, mySharedService, myPageMode){
    $scope.settings = pageSettings.get(true);

    $scope.settingsSubmit = function(){
        pageSettings.set($scope.settings);
        pageSettings.sync($scope.settings, $scope.$parent.pageSettings, 'cut');

        myPageMode.toggle('settings');
        mySharedService.say('settings update');
    };
}]);