var associoCreate = angular.module('associoCreate', []);

function mainController($scope, $http) {
  $scope.template;
  $scope.nextNode;
  $scope.currentNode;

  function activate() {
    $http.post('/create').success(function (data) {
      var template = data.template;
      $scope.template = template;

      if (template.edges && template.edges.length > 0) {
        console.log(edgeListToNodes(template.edges));

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
      }).success(function (response) {
        console.log("Success!", response);
        $scope.template = response.template;
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

function edgeListToNodes(edges) {
  var nodes = [];
  var links = [];

  var i;
  for (i = 0; i < edges.length; i++) {
    var edge = edges[i];

    var i_nodeA = nodes.indexOf(edge.node_a);
    var i_nodeB = nodes.indexOf(edge.node_b);

    // New node. Update index
    if (i_nodeA < 0) {
      nodes.push(edge.node_a);
      i_nodeA = nodes.length - 1;
    }
    if (i_nodeB < 0) {
      nodes.push(edge.node_b);
      i_nodeB = nodes.length - 1;
    }

    links.push({
      source: i_nodeA,
      target: i_nodeB
    });

  }
  var nodeList = [];
  
  for (i = 0; i < nodes.length; i++) {
    nodeList[i] = {name: nodes[i]};
  }

  var result = {
    nodes: nodeList,
    links: links
  };
  return result;
}

associoCreate.controller('mainController', ['$scope', '$http', mainController]);