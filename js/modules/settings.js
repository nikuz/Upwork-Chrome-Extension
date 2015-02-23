(function(){
    var settings = {
        curPage: 0,
        jobsPerPage: 10,
        budgetFrom: 0,
        budgetTo: 1000000,
        daysPosted: 50,
        notifyInterval: 5,
        notifyDisabled: false,
        duration: {
            value: 'All',
            values: [
                'All',
                'Week',
                'Month',
                'Quarter',
                'Semester',
                'Ongoing'
            ]
        },
        jobType: {
            value: 'All',
            values: [
                'All',
                'Hourly',
                'Fixed'
            ]
        },
        workload: {
            value: 'All',
            values: [
                'All',
                'As needed',
                'Part time',
                'Full time'
            ]
        }
    };
    window.pageSettings = {
        get: function(full){
            var _s = storage.get('settings');
            if(full){
                _s = _s ? this.sync(_s, null, 'expand') : settings;
            } else {
                _s = _s ? _s : this.sync(settings, null, 'cut');
            }

            return _s;
        },
        sync: function(from, to, type){
            to = to || JSON.parse(JSON.stringify(settings));
            for(var i in from){
                if(from.hasOwnProperty(i)){
                    if(type === 'expand'){
                        if(to[i].value) to[i].value = from[i];
                        else to[i] = from[i];
                    } else {
                        to[i] = from[i].value || from[i];
                    }
                }
            }
            return to;
        },
        set: function(_s){
            _s = this.sync(_s, null, 'cut');
            storage.set('settings', _s);
        },
        setOne: function(_s, props){
            extend(_s, props);
            this.set(_s);
        }
    };
})();