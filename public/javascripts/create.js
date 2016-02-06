var associoCreate = angular.module('associoCreate', []);

function mainController($scope, $http) {
  $scope.template;
  $scope.nextNode;
  $scope.currentNode;

  function activate() {
    $http.post('/create').success(function (data) {
      var template = data.template;
      $scope.template = template;

      if (template.edges) {
        var lastEdge = template.edges[template.edges.length-1];
        console.log("Last node: ", lastEdge.node_b);
        $scope.currentNode = lastEdge.node_b;
      }
      console.log(template);
    });
  }

  $scope.addMove = function() {
    if ($scope.currentNode) {

      console.log("Add edge from %s to %s", $scope.currentNode, $scope.nextNode);
      $http.post('/template/' + $scope.template._id + '/add', {
        node_a: $scope.currentNode,
        node_b: $scope.nextNode
      });
    } else {
      console.log("First node: ", $scope.nextNode);
    }
    $scope.currentNode = $scope.nextNode;
    $scope.nextNode = null;
  }
  
  $scope.deleteMove = function() {
    console.log("Delete move!");
  }

  activate();
}

associoCreate.controller('mainController', ['$scope', '$http', mainController]);