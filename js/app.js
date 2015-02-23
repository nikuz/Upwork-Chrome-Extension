var myApp = angular.module('myApp', [
    'yaru22.angular-timeago'
]);
myApp.config(['$provide', function ($provide){
    $provide.decorator('$rootScope', ['$delegate', function ($delegate) {
        $delegate.safeApply = function (fn) {
            var phase = $delegate.$$phase;
            if (phase === "$apply" || phase === "$digest") {
                if (fn && typeof fn === 'function') {
                    fn();
                }
            } else {
                $delegate.$apply(fn);
            }
        };
        return $delegate;
    }]);
}]);