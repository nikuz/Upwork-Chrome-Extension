oDesk.config({
    'key': '6892f6b7b2ad1170412588fad3762d21',
    'secret': '886c89c899e1e1a8'
});

var settings = pageSettings.get();
var watcher = {
    checkAccess: function(){
        return storage.get('feeds') && storage.get('access');
    },
    getNew: function(){
        if(!this.checkAccess()) return;
        proxy.cacheAddNew();
    },
    newJobsNotifierShownTime: 7000,
    newJobsCountLast: 0,
    newJobsCheck: function(){
        if(!this.checkAccess()) return;

        var that = this,
            newJobs = proxy.cacheCheckNew().length;

        if(newJobs && newJobs !== this.newJobsCountLast){
            this.newJobsCountLast = newJobs;

            // notifier
            this.notifier && this.notifier.close();

            this.browserNotifierCheckPermissions(function(){
                that.notifier = new Notification(storage.get('feeds')+':', {
                    body: 'You have new '+newJobs+' vacancies',
                    icon: '/images/icon48.png'
                });
                that.notifier.onclick = function(){
                    if(!that.notifierWindow){
                        that.notifierWindow = window.open('popup.html');
                        that.notifierWindow.onbeforeunload = function(){
                            that.notifierWindow = null;
                        };
                    } else {
                        that.notifierWindow.focus();
                    }
                };
                setTimeout(function(){
                    that.notifier && that.notifier.close();
                    that.notifier = null;
                }, that.newJobsNotifierShownTime);
            });

            // popup
            var popup = chrome.extension.getViews({type: 'popup'})[0];
            if(popup){
                popup.postMessage('newJobs', '*');
            } else {
                this.newJobsBadge(newJobs);
            }
        }
    },
    newJobsBadge: function(count){
        chrome.browserAction.setBadgeText({
            text: count.toString()
        });
    },
    newJobsBadgeReset: function(){
        this.newJobsBadge('');
        this.newJobsCountLast = 0;
    },
    newJobsAlarmName: 'newJobsCheck',
    newJobsAlarmInterval: 0,
    newJobsAlarm: function(){
        var time = settings.notifyInterval,
            alarmDisabled = settings.notifyDisabled;

        time = time >= 1 ? time : 1;

        chrome.alarms.clear(this.newJobsAlarmName);
        if(!alarmDisabled){
            chrome.alarms.create(this.newJobsAlarmName, {
                periodInMinutes: time
            });
        }
        this.newJobsAlarmInterval = time;
    },
    settingsCheck: function(){
        settings = pageSettings.get();
        this.newJobsAlarm();
    },
    browserNotifierCheckPermissions: function(callback){
        if("Notification" in window){
            if(Notification.permission === "granted"){
                return callback();
            } else if(Notification.permission !== 'denied'){
                Notification.requestPermission(function(permission){
                    if(!('permission' in Notification)){
                        Notification.permission = permission;
                    }
                    if(permission === "granted"){
                        return callback();
                    }
                });
            }
        }
    },
    getWatchNewTimer: function(){
        var time = settings.notifyInterval / 2;
        return time >= 1 ? time : 1;
    },
    cacheLength: function(){
        if(!this.checkAccess()) return;
        proxy.cacheLengthCheck();
    }
};

chrome.alarms.create('settingsWatch', {
    periodInMinutes: 1
});
chrome.alarms.create('watchNew', {
    periodInMinutes: watcher.getWatchNewTimer()
});
watcher.newJobsAlarm();
chrome.alarms.create('cacheLengthWatch', {
    periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function(alarm){
    switch(alarm.name){
        case 'settingsWatch': watcher.settingsCheck();
            break;
        case 'watchNew': watcher.getNew();
            break;
        case 'newJobsCheck': watcher.newJobsCheck();
            break;
        case 'cacheLengthWatch': watcher.cacheLength();
            break;
        default:
    }
});