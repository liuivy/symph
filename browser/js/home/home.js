app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        controller: 'HomeCtrl',
        templateUrl: 'js/home/home.html'
    });
})

app.controller('HomeCtrl', ['$scope, $uibModal', function($scope, $uibModal){

  var smodal; 
  var lmodal;

  $scope.sopen = function () {
  	if(lmodal) lmodal.close();
    smodal = $uibModal.open(signup)
  }

  $scope.lopen = function () {
  	if(smodal) smodal.close();
    lmodal = $uibModal.open(login)
  }



	var signup = {
		animation: true,
		size: "lg",
		templateUrl: 'js/signup/signup.html',
		controller: ['$scope', '$uibModalInstance', 'UserFactory', 'AuthService', function($scope, $uibModalInstance, UserFactory, AuthService){

		    $scope.sendSignup = function(signup){
		    var newLogin = {username: signup.username, email: signup.email, password: signup.password};
		    UserFactory.create(signup)
		    .then(function(newUser){
		      return AuthService.login(newLogin);
		    })
		    .then(function(){
		      $uibModalInstance.close()
		    })
		  }

		    $scope.login = function(){
		  	smodal.close()
			lmodal = $uibModal.open(login)
		  }

		}]
	}

	var login = {
		animation: true,
	    size: "lg",
	    templateUrl: 'js/login/login.html',
	    controller: ['$scope', '$uibModalInstance', 'AuthService', '$state', function($scope, $uibModalInstance, AuthService, $state){

	    $scope.login = {};

	    $scope.sendLogin = function (loginInfo) {

	        $scope.error = null;

	        AuthService.login(loginInfo).then(function () {
	            $state.go('home')
	            lmodal.close()

	        }).catch(function () {
	            $scope.error = 'Invalid login credentials.';
	        })

		}

		}]
 	}
}])
