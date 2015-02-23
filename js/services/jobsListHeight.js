myApp.factory('myJobsListHeight', function(){
    return function(){
        angular.element(document).ready(function(){
            var wh = window.innerHeight;
            if (wh < 600) {
                var jobList = document.querySelector('#jobsList');
                jobList.style.maxHeight = wh - 161 + 'px';
            }
        });
    }
});