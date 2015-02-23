myApp.factory('myJobsFolders', ['myJobsPager', function(myJobsPager){
    return {
        move: function(jobList, folder, curFolder){
            var jobListCopy = myJobsPager.clear(jobList.slice()),
                originalJobsList = storage.get(curFolder),
                targetFolder = storage.get(folder) || [];

            if(!originalJobsList) return;

            var jobMatchKey, i = 0,
                jobItem, matches;

            if((curFolder === 'inbox') || (curFolder === 'favorites' && folder === 'trash') || (curFolder === 'trash' && folder === 'trash')){
                var filteredJobs = [];

                while(jobListCopy[i]){
                    jobItem = jobListCopy[i];
                    if(jobItem.selected){
                        matches = true;
                        jobListCopy.splice(i, 1);

                        if(!this.findDuplicate(targetFolder, jobItem.id) || folder === 'trash'){
                            jobMatchKey = this.findPosition(originalJobsList, jobItem.id);
                            filteredJobs.push(originalJobsList.splice(jobMatchKey, 1)[0]);
                        }
                    } else {
                        i++;
                    }
                }
                if(matches){
                    if(curFolder === 'trash'){
                        originalJobsList.length ? storage.set(curFolder, originalJobsList) : storage.clear(curFolder);
                    } else {
                        // concatenate + sort
                        targetFolder = targetFolder.concat(filteredJobs).sort(this.sort);
                        this.checkLimit(targetFolder, folder); // check limit
                        storage.set(folder, targetFolder);
                        storage.set(curFolder, originalJobsList);
                        this.jobsMakeViewed(filteredJobs, folder);
                    }
                }
                return jobListCopy;
            }
        },
        add: function(jobList, additional, folder){
            var i = 0, l = additional.length;
            for(; i<l; i++){
                if(!this.findDuplicate(jobList, additional[i].id)){
                    jobList.push(additional[i]);
                }
            }
            this.checkLimit(jobList, folder);
            return jobList.sort(this.sort);
        },
        limits: {
            inbox: 100,
            favorites: 500,
            trash: 500
        },
        checkLimit: function(jobList, folder){
            jobList.splice(this.limits[folder]);
        },
        findDuplicate: function(targetFolder, duplicateId){
            var position = this.findPosition(targetFolder, duplicateId);
            return position !== undefined;
        },
        findPosition: function(originalJobsList, targetId){
            var i = 0;
            while(originalJobsList[i]){
                if(originalJobsList[i].id === targetId){
                    return i;
                }
                i++;
            }
        },
        jobsMakeViewed: function(filteredJobs, folder){
            var ids = [],
                i = 0, l = filteredJobs.length;

            for(; i<l; i++){
                ids.push(filteredJobs[i].id);
            }

            chrome.runtime.getBackgroundPage(function(bgPage){
                bgPage.proxy.cacheNewMakeViewed(ids, folder);
            });
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
    }
}]);