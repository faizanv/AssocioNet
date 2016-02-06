var associoPlay = angular.module('associoPlay', []);

function mainController($scope, $http, $routeParams) {
  $scope.game;
  $scope.template_id = $routeParams["template_id"];

  console.log($scope.template_id);
  
  function activate() {
    $http.post('/play/' + $scope.template_id).success(function (data) {
      var game = data.game;
      $scope.game = game;

      console.log("Game: ", game);
    });
  }

  $scope.addMove = function() {
    console.log("Add move!");  
  }
  
  $scope.deleteMove = function() {
    console.log("Delete move!");
  }

  activate();
}

associoPlay.controller('mainController', ['$scope', '$http', '$routeParams', mainController]);