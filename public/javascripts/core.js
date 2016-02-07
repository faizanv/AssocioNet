var associoCreate = angular.module('associoCreate', []);
var associoPlay = angular.module('associoPlay', []);

function createController($scope, $http) {
  $scope.template;
  $scope.nextNode;
  $scope.currentNode;

  var canvas = createHiDPICanvas(600,200);
  document.getElementById('canvas_container').appendChild(canvas);


  function activate() {
    $http.post('/create').success(function (data) {
      var template = data.template;
      $scope.template = template;

      if (template.edges && template.edges.length > 0) {

        var lastEdge = template.edges[template.edges.length-1];
        console.log("Last node: ", lastEdge.node_b);
        $scope.currentNode = lastEdge.node_b;

      }
      console.log(template);
    });

    if (!('webkitSpeechRecognition' in window)) {
      upgrade();
    } else {
      $scope.recognition = new webkitSpeechRecognition();
      var recognition = $scope.recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = function(event) {
        var result = "";
        for (var i = event.resultIndex; i < event.results.length; i++) {
          console.log(event.results[i][0].transcript);
          result += event.results[i][0].transcript;
        }
        $scope.nextNode = result;
        setTimeout(function (){
          $scope.addMove();
        }, 1000);
      }
      recognition.onerror = function(event) {
        console.error(event);
      }
      recognition.onend = function() {
        console.log("done");
      }
    }
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
        changeCurrentNode($scope.currentNode, $scope.template);
      });
    } else {
      console.log("First node: ", $scope.nextNode);
      $http.post('/template/' + $scope.template._id + '/add', {
        root: $scope.nextNode
      }).success(function (response) {
        console.log("Success!", response);
        $scope.template = response.template;
        changeCurrentNode($scope.currentNode, $scope.template);
      });
    }
    $scope.currentNode = $scope.nextNode;
    $scope.nextNode = null;
  }

  $scope.deleteMove = function() {
    console.log("Delete move!");
  }

  $scope.startDictation = function() {
    console.log("dictate clicked");
    $scope.recognition.start();
  }
  // $scope.textChange('ngKeystroke', function () {
  //   return {
  //     restrict: 'A'
  //   }
  // });

  activate();
}


function playController($scope, $http) {
  $scope.guess;
  $scope.game;
  $scope.moves;
  $scope.template_id;

  function activate() {
    $http.post('/play/' + $scope.template_id).success(function (data) {
      var game = data.game;
      var moves = data.moves;
      $scope.game = game;
      $scope.moves = moves;
      $scope.currentNode = game.root;

      graphD3Template(edgeListToNodes(game.root, moves));
      console.log("response: ", data);
    });
  }

  $scope.init = function (template_id) {
    $scope.template_id = template_id;
    activate();
  }

  $scope.addMove = function() {
    console.log("Add move!");
    $http.post('/play/' + $scope.template_id + '/move', {
      node_a: $scope.currentNode,
      node_b: $scope.guess
    }).success(function (data) {
      console.log(data);
      if (data.move.correct) {
        $scope.currentNode = data.move.node_b;
        if (!$scope.moves) {
            $scope.moves = [];
        }
        $scope.moves.push(data.move);
        graphD3Template(edgeListToNodes($scope.game.root, $scope.moves));
      }
    });
    $scope.guess = null;
  }

  $scope.deleteMove = function() {
    console.log("Delete move!");
  }
}

associoPlay.controller('playController', ['$scope', '$http', playController]);
associoCreate.controller('createController', ['$scope', '$http', createController]);

function edgeListToNodes(root, edges) {
  var nodes = [];
  var links = [];

  var i;
  nodes.push(root);
  if (edges) {
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
