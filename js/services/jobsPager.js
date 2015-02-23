myApp.factory('myJobsPager', function(){
    function pager(jobList, jobsPerPage){
        arguments.callee.clear(jobList);

        var indexes = [];
        jobList.forEach(function(item, index){
            if(index>0 && index%jobsPerPage === 0){
                indexes.push(index);
            }
        });
        indexes.forEach(function(item, index){
            jobList.splice(item+index, 0, {
                pageNum: index+2
            });
        });
        return jobList;
    }

    pager.clear = function(jobList){
        jobList.forEach(function(item, index){
            if(item.pageNum){
                jobList.splice(index, 1);
            }
        });
        return jobList;
    };
    pager.count = function(jobList){
        var count = 0;
        jobList.forEach(function(item, index){
            if(item.pageNum){
                count++;
            }
        });
        return ++count;
    };

    return pager;
});