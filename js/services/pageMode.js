myApp.factory('myPageMode', ['$rootScope', function($rootScope){
    return {
        modes: {
            init: 'pageInitialMode',
            data: 'pageDataExistsMode',
            error: 'pageErrorMode',
            load: 'pageLoadMode',
            settings: 'appSettingsMode',
            empty: 'pageDataEmpty',
            wide: 'pageWideMode',
            full: 'pageNoMoreJobs',
            extraInitial: 'pageExtraInitial'
        },
        set: function(mode){
            $rootScope.pageStateCL = this.modes[mode] || mode;
        },
        get: function(mode){
            return this.modes[mode] || $rootScope.pageStateCL || '';
        },
        add: function(mode){
            var pageCL = this.get();
            mode = this.get(mode);
            if(pageCL.indexOf(mode) === -1){
                this.set(pageCL+' '+mode);
            }
        },
        remove: function(mode){
            var pageCL = this.get();
            pageCL = pageCL.replace(new RegExp('\\s*'+this.get(mode)+'\\s*'), '');
            this.set(pageCL);
        },
        has: function(mode){
            var pageCL = this.get();
            mode = this.get(mode);
            return pageCL.indexOf(mode) !== -1;
        },
        toggle: function(mode){
            var pageCL = this.get();
            mode = this.get(mode);
            if(pageCL.indexOf(mode) !== -1){
                pageCL = pageCL.replace(new RegExp('\\s*'+mode+'\\s*'), '');
            } else {
                pageCL += ' '+mode;
            }
            this.set(pageCL);
        }
    }
}]);