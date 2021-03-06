(function(){              
    
    var app = angular.module('mainApp',['ui.bootstrap','ui.router', 'ui-notification'])

    app.run(['$rootScope', '$window', '$location', '$state', '$urlRouter', 'AuthenticationFactory', function ($rootScope,  $window, $location, $state, $urlRouter, AuthenticationFactory) {
            
            angular.reloadWithDebugInfo = angular.noop; //dont allow user to reload and debug
            // when the page refreshes, check if the user is already logged in
            AuthenticationFactory.check().then(function(data){
                // console.log("AuthenticationFactory", data)
                if(data.status){
                    $urlRouter.listen();
                    $urlRouter.sync();
                }else{
                    // console.log("redirect to login")
                    $state.go('login')  
                }
            });

                    
            $rootScope.$on('$stateChangeSuccess', function (event, nextRoute, currentRoute) {
                if(nextRoute.name == 'login'||nextRoute.name == 'search'){
                    $rootScope.relative = false
                }else{
                    $rootScope.relative = true
                }
            });
    }]);

    app.factory('AuthenticationFactory', ["$window", "$http", "$q", "$rootScope", function ($window, $http, $q, $rootScope) {
        var auth = {
            isLogged: false,
            check: function () {
                var deferred = $q.defer();
                $http.post('/user/session').then(function(data){
                    // console.log("AuthenticationFactory check: ", data)
                    auth.isLogged = data.data.status;
                    if(data.data.status){
                        $rootScope.userInfo = {
                            user: data.data.userInfo.username,
                            role: data.data.userInfo.role,
                        }
                        // console.log("$rootScope.userInfo", $rootScope.userInfo);
                    }
                    deferred.resolve(data.data);
                })
                return deferred.promise;
            }
        };

        return auth;
    }]);

    Array.prototype.contains = function(obj) {
      var i = this.length;
      while (i--)
        if (this[i] == obj)
          return true;
      return false;
    }

    app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode(true); //remove # from url
        $urlRouterProvider.deferIntercept();
        $urlRouterProvider.otherwise('home');  //go to default url
        $stateProvider

            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'homeCntrl',
                access: {
                    requiredLogin: false
                },

            })
            .state('home', {//after upload file redirect to here
                url: '/home',
                templateUrl: 'templates/home.html',
                controller: 'homeCntrl',
                access: {
                    requiredLogin: true
                },

            })
    }]);

    app.directive('navigationBar', ["$rootScope", function($rootScope){
        return{
            restrict: 'E',
            transclude:true,
            templateUrl: '/templates/navigation.html',
        }
    }])

    
    app.factory('mainFact', ["$http", "$q", function ($http, $q) {
        var postProcess = function(url,query){
            var d = $q.defer();
            $http.post(url, query).success(function(data){
                d.resolve(data);
            })
            return d.promise;
        };  
        return { postProcess: postProcess}  
    }]);

    app.factory('notify', ["Notification", function (Notification) {
        var notify = function (status, msg) {
            if (status == 1)
                Notification.success(msg);
            else
            if (status == 2)
                Notification.info(msg);
            else
                Notification.error(msg);
        };
        return {
            notify: notify
        };
    }]);

    app.factory('UserAuthFactory', ["$state", "$rootScope", "$window", "$location", "$http", "AuthenticationFactory", function ($state, $rootScope, $window, $location, $http, AuthenticationFactory) {
        return {
            login: function (username, password, tnc, rememberMe) {
                return $http.post('/users/login', {
                    username: username,
                    password: password,
                    agree: tnc,
                    rememberMe: rememberMe
                });
            },
            logout: function () {
                $http.post('/logout', {hints: $window.localStorage.hints});
                // console.log(AuthenticationFactory.isLogged)
                if (AuthenticationFactory.isLogged) {
                    delete $rootScope.userInfo;
                    AuthenticationFactory.isLogged = false;
                    delete AuthenticationFactory.user;
                    delete AuthenticationFactory.userRole;

                    $state.go('login'); //redirect to login/home page
                }
            }
        };
    }]);

    app.controller('homeCntrl', ["$scope", "$rootScope", "$stateParams", "mainFact", "notify", "$window", "AuthenticationFactory", "UserAuthFactory", "$state", "$stateParams", "$sce", "$q","$filter", function($scope, $rootScope, $stateParams, mainFact, notify, $window,AuthenticationFactory, UserAuthFactory, $state,Upload,$stateParams, $sce, $q, $filter){
        
        $scope.loggingIn = false;
        $scope.login = function () {
            $rootScope.userInfo = {}
            $scope.loggingIn = true;
            var username = $scope.user.username,
                password = $scope.user.password

            if (username !== undefined && password !== undefined) {
                mainFact.postProcess('/loginAuth', $scope.user).then(function (data) {
                    // console.log('out login', data)
                    $scope.user = {
                        username: '',
                        password: ''
                    };
                    $scope.loggingIn = false;

                    if(data.status){
                        AuthenticationFactory.isLogged = true;
                        $rootScope.userInfo.user = data.username
                        $rootScope.userInfo.role = data.role
                        $scope.userLogged = true
                        $window.sessionStorage.user = data.username;
                        $state.go('home')
                    }else{
                        notify.notify(0, data.message);
                    }

                });
            }else {
                $scope.user = {
                    username: '',
                    password: ''
                };

                $scope.loggingIn = false;
                notify.notify(0, 'Invalid credentials!!!');
            }
        }; 

        $scope.logout = function () {
            UserAuthFactory.logout();
        }

        $scope.getProducts = function() {
            mainFact.postProcess('/api/getProducts').then(function (data) {
                // console.log('out login', data)
                $scope.product = data.data
            })
        }

        $scope.addToCart = function(index) {
            $scope.showModal = true
            $scope.p = $scope.product[index]
            $scope.selected = ''
            if($scope.p.select) {
                $scope.selectOp = $scope.p.select[Object.keys($scope.p.select)[0]]
                $scope.param = Object.keys($scope.p.select)[0]
            }
            $scope.ind = index
            // console.log(123444,$scope.selectOp, Object.keys($scope.p.select)[0]) 
        }
        $scope.cartProduct = []
        $rootScope.showCart = false
        $scope.selected = ''
        $scope.finalToCart = function(index, selected) {
            if(!selected) return alert('please select required field\'s')
            $scope.showModal = false
            var count = 0
            
            $scope.product[index].count--
            if ($scope.cartProduct.length) {
                $scope.cartProduct.forEach(function(d, i) {
                    if (d._id == $scope.product[index]._id) {
                        $scope.cartProduct[i].count++
                        count = $scope.cartProduct[i].count++
                    }
                })
            }
            if (!count) {
                count = 1
                $scope.cartProduct[$scope.cartProduct.length] = angular.copy($scope.product[index])
                $scope.cartProduct[$scope.cartProduct.length-1].count = count
            }
            // console.log($scope.cartProduct)
            $scope.showModal = false
        }

        $scope.loadCart = function() {
            $rootScope.showCart = true
            $rootScope.showOrders = false
        }

        $scope.loadHome = function(){
            $rootScope.showCart = false
        $rootScope.showOrders = false

        }

        $scope.placeOrder = function(user) {
            if(!$scope.cartProduct.length) return alert('Nothing to order')
            $scope.cartProduct.forEach(function(d, i){
                $scope.cartProduct[i].userDetail = user 
            })
            mainFact.postProcess('/api/placeOrder', $scope.cartProduct).then(function (data) {
                if(data.status) alert('order placed successfully')
                $scope.cartProduct = []

            })
        }
        $rootScope.showOrders = false
        $scope.loadOrders = function(){
            mainFact.postProcess('/api/loadOrders').then(function (data) {
                // console.log(data)
                if(data.status) {
                    $rootScope.orderProduct = data.data
                    $rootScope.showOrders = true 
                    $rootScope.showCart = false
                }else alert(data.message)
                // console.log($rootScope.orderProduct)
            }) 
        }

    }])  
})();
