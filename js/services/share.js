myApp.factory('mySharedService', ['$rootScope', function($rootScope){
    return {
        message: '',
        value: null,
        say: function(msg, value){
            this.message = msg;
            this.value = value;
            this.broadcastItem();
        },
        broadcastItem: function(){
            $rootScope.$broadcast('handleBroadcast');
        }
    }
}]);