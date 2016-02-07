var associoCreate = angular.module('associoCreate', []);
var associoPlay = angular.module('associoPlay', []);
var associoVis = angular.module('associoVis', []);

function createController($scope, $http) {
  $scope.template;
  $scope.nextNode;
  $scope.currentNode;

  // var canvas = createHiDPICanvas(600,200);
  // document.getElementById('canvas_container').appendChild(canvas);


  function activate() {
    $http.post('/create').success(function (data) {
      var template = data.template;
      $scope.template = template;

      if (template.edges && template.edges.length > 0) {

        var lastEdge = template.edges[template.edges.length-1];
        console.log("Last node: ", lastEdge.node_b);
        $scope.currentNode = lastEdge.node_b;

      }
      graphD3Template(edgeListToNodes($scope.currentNode, $scope.template.edges));
      // console.log(template);
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
        graphD3Template(edgeListToNodes($scope.currentNode, $scope.template.edges));
      });
    } else {
      console.log("First node: ", $scope.nextNode);
      $http.post('/template/' + $scope.template._id + '/add', {
        root: $scope.nextNode
      }).success(function (response) {
        console.log("Success!", response);
        $scope.template = response.template;
        console.log({response : response});
        graphD3Template(edgeListToNodes($scope.currentNode, $scope.template.edges));
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

  $scope.newTemplate = function() {
    console.log("hit");
    $http.get('/newTemplate').then(function(res) {
      console.log(res);
      $scope.apply();
    });
  }

    // CODE FOR D3
  //Constants for the SVG
var width = window.innerWidth,
    height = 350;

// Resolves collisions between d and all other circles.
var linkDistance = 120;
var padding = 5; // separation between circles
var radius=30;


// d3.json("/graph.json", function(error, graph) {
//     if (error) throw error;

var graphD3Template = function(graph) {
    console.log(graph);
    //Set up the colour scale
    var lightBlue = "#89C4F4";
    var darkBlue = "#2c3e50";

    //Set up the force layout
    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(linkDistance)
        .size([width, height]);

    var el = document.querySelector( 'svg' );
    if (el) {
        el.parentNode.removeChild( el );
    }
    //Append a SVG to the body of the html page. Assign this SVG as an object to svg
    var svg = d3.select("#canvas_container").insert("svg",":first-child")
        .attr("width", width)
        .attr("height", height);

    //Creates the graph data structure out of the json data
    force.nodes(graph.nodes)
        .links(graph.links)
        .start();

    //Create all the line svgs but without locations yet
    var link = svg.selectAll('.link')
        .data(graph.links)
        .enter().append("line")
        .attr('class', 'link')
        .style("stroke","black")
        .style("stroke-width", 2);

    //TODO: refactor class structure

    //Do the same with the circles for the nodes - no 
    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("class", function(d) {
            if (d.name === $scope.currentNode) {
                return "focus node";
            } else if (d.name === '?') {
                return "non-hover node"
            } else {
                return "node";
            }
        })
        .attr("r", radius)
        .style("fill", lightBlue)
        .on('click', function() {
            d = this.__data__;
            if (d.name !== '?') {
                d3.select("svg").selectAll("circle").classed('focus', false);
                d3.select(this).classed("focus", true);
                $scope.currentNode = d.name;
                $scope.$apply();
            }
        });
        // .call(force.drag);

    var text = svg.selectAll(".text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("class", "text")
        .attr("text-anchor","middle")
        .attr("alignment-baseline", "middle")
        .style("fill", darkBlue)
        .text(function (d) {
            return d.name;
        });

    //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
    force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
            return d.source.y;
        })
            .attr("x2", function (d) {
            return d.target.x;
        })
            .attr("y2", function (d) {
            return d.target.y;
        });

        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
            return d.y;
        });
        text.attr("x", function(d) {
            return d.x;
        })
        .attr("y", function(d) {
            return d.y;
        });
        
        node.each(collide(0.5)); //Added
    });
    //---Insert------
    

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(graph.nodes);
      return function(d) {
        var rb = 2*radius + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && d && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y);
              if (l < rb) {
              l = (l - rb) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
}

  activate();
}


function playController($scope, $http) {
  $scope.guess;
  $scope.nodes;
  $scope.links;
  $scope.template_id;
  $scope.disableInput = true;

  function activate() {
    $http.post('/play/' + $scope.template_id).success(function (data) {
      console.log(data);
      $scope.nodes = data.graph.nodes;
      $scope.moves = (data.graph.links) ? data.graph.links : [];
      $scope.currentNode = $scope.nodes[0].name;

      graphD3Template(data.graph);
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

        $scope.currentNode = $scope.guess
        $scope.moves.push(data.move);
        graphD3Template(data.graph);
      }
      $scope.guess = null;
    });
  }

  $scope.deleteMove = function() {
    console.log("Delete move!");
  }


  // CODE FOR D3
  //Constants for the SVG
  var width = window.innerWidth,
      height = 350;

  // Resolves collisions between d and all other circles.
  var linkDistance = 120;
  var padding = 5; // separation between circles
  var radius=30;


  // d3.json("/graph.json", function(error, graph) {
  //     if (error) throw error;

  var graphD3Template = function(graph) {
      console.log(graph);
      //Set up the colour scale
      var lightBlue = "#89C4F4";
      var darkBlue = "#2c3e50";

      //Set up the force layout
      var force = d3.layout.force()
          .charge(-120)
          .linkDistance(linkDistance)
          .size([width, height]);

    var el = document.querySelector( 'svg' );
    if (el) {
        el.parentNode.removeChild( el );
    }
    //Append a SVG to the body of the html page. Assign this SVG as an object to svg
    var svg = d3.select("body").insert("svg",":first-child")
        .attr("width", width)
        .attr("height", height);

    //Creates the graph data structure out of the json data
    force.nodes(graph.nodes)
        .links(graph.links)
        .start();

    //Create all the line svgs but without locations yet
    var link = svg.selectAll('.link')
        .data(graph.links)
        .enter().append("line")
        .attr('class', 'link')
        .style("stroke","black")
        .style("stroke-width", 2);

    //TODO: refactor class structure

    //Do the same with the circles for the nodes - no 
    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("class", function(d) {
            if (d.name === $scope.currentNode) {
                return "focus node";
            } else if (d.name === '?') {
                return "non-hover node"
            } else {
                return "node";
            }
        })
        .attr("r", radius)
        .style("fill", lightBlue)
        .on('click', function() {
            d = this.__data__;
            if (d.name !== '?') {
                d3.select("svg").selectAll("circle").classed('focus', false);
                d3.select(this).classed("focus", true);
                $scope.currentNode = d.name;
                $scope.$apply();
            }
        });
        // .call(force.drag);

    var text = svg.selectAll(".text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("class", "text")
        .attr("text-anchor","middle")
        .attr("alignment-baseline", "middle")
        .style("fill", darkBlue)
        .text(function (d) {
            return d.name;
        });

      //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
      force.on("tick", function () {
          link.attr("x1", function (d) {
              return d.source.x;
          })
              .attr("y1", function (d) {
              return d.source.y;
          })
              .attr("x2", function (d) {
              return d.target.x;
          })
              .attr("y2", function (d) {
              return d.target.y;
          });

          node.attr("cx", function (d) {
              return d.x;
          })
              .attr("cy", function (d) {
              return d.y;
          });

          text.attr("x", function(d) {
              return d.x;
          })
          .attr("y", function(d) {
              return d.y;
          })
          
          node.each(collide(0.5)); //Added
      });

      //---Insert------
      
        force.on("end", function () {
            $scope.disableInput = false;
            $scope.$apply();
            console.log("should be good");
        });

      function collide(alpha) {
        var quadtree = d3.geom.quadtree(graph.nodes);
        return function(d) {
          var rb = 2*radius + padding,
              nx1 = d.x - rb,
              nx2 = d.x + rb,
              ny1 = d.y - rb,
              ny2 = d.y + rb;
          
          quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
              var x = d.x - quad.point.x,
                  y = d.y - quad.point.y,
                  l = Math.sqrt(x * x + y * y);
                if (l < rb) {
                l = (l - rb) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
              }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
          });
        };
      }
  }
}

function visController($scope, $http) {

  function activate() {
    $http.get('/associations/graph').success(function (data) {
      console.log(data);

      graphD3Template(data.graph);
      console.log("response: ", data);
    });
  }

  activate();

  // CODE FOR D3
  //Constants for the SVG
  var width = window.innerWidth,
      height = window.innerHeight;

  // Resolves collisions between d and all other circles.
  var linkDistance = 120;
  var padding = 5; // separation between circles
  var radius=30;
  var min_zoom = 0.1;
    var max_zoom = 7;

  // d3.json("/graph.json", function(error, graph) {
  //     if (error) throw error;

  var graphD3Template = function(graph) {
      console.log(graph);
      //Set up the colour scale
      var lightBlue = "#89C4F4";
      var darkBlue = "#2c3e50";

      //Set up the force layout
      var force = d3.layout.force()
          .charge(-120)
          .linkDistance(linkDistance)
          .size([width, height]);

      var el = document.querySelector( 'svg' );
      if (el) {
          el.parentNode.removeChild( el );
      }
      //Append a SVG to the body of the html page. Assign this SVG as an object to svg
      var svg = d3.select("body").insert("svg",":first-child")
          .attr("width", width)
          .attr("height", height);

        var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])
        var g = svg.append("g");

      //Creates the graph data structure out of the json data
      force.nodes(graph.nodes)
          .links(graph.links)
          .start();

      //Create all the line svgs but without locations yet
      var link = g.selectAll('.link')
          .data(graph.links)
          .enter().append("line")
          .attr('class', 'link')
          .style("stroke","black")
          .style("stroke-width", 2);

      //TODO: refactor class structure

      //Do the same with the circles for the nodes - no 
      var node = g.selectAll(".node")
          .data(graph.nodes)
          .enter().append("circle")
          .attr("class", function(d) {
              if (d.name === $scope.currentNode) {
                  return "focus node";
              } else {
                  return "node";
              }
          })
          .attr("r", function (d) {
            console.log(d)
            var val = radius + (5 * (d.count - 1));
            d.radius = val;
            return val;
          })
          .style("fill", lightBlue)
          .on('click', function() {
              d = this.__data__;
              d3.select("svg").selectAll("circle").attr('class', 'node');
              d3.select(this).attr("class", "focus node");
              $scope.currentNode = d.name;
              $scope.$apply();
          });
          // .call(force.drag);

      var text = g.selectAll(".text")
          .data(graph.nodes)
          .enter().append("text")
          .attr("class", "text")
          .attr("text-anchor","middle")
          .attr("alignment-baseline", "middle")
          .style("fill", darkBlue)
          .text(function (d) {
              return d.name;
          });

          zoom.on("zoom", function() {
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

    svg.call(zoom);
      //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
      force.on("tick", function () {
          link.attr("x1", function (d) {
              return d.source.x;
          })
              .attr("y1", function (d) {
              return d.source.y;
          })
              .attr("x2", function (d) {
              return d.target.x;
          })
              .attr("y2", function (d) {
              return d.target.y;
          });

          node.attr("cx", function (d) {
              return d.x;
          })
              .attr("cy", function (d) {
              return d.y;
          });

          text.attr("x", function(d) {
              return d.x;
          })
          .attr("y", function(d) {
              return d.y;
          })
          
          node.each(collide(0.5)); //Added
      });

      //---Insert------
      

      function collide(alpha) {
        var quadtree = d3.geom.quadtree(graph.nodes);
        return function(d) {
          var rb = 2*d.radius + padding,
              nx1 = d.x - rb,
              nx2 = d.x + rb,
              ny1 = d.y - rb,
              ny2 = d.y + rb;
          
          quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
              var x = d.x - quad.point.x,
                  y = d.y - quad.point.y,
                  l = Math.sqrt(x * x + y * y);
                if (l < rb) {
                l = (l - rb) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
              }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
          });
        };
      }
  }
}

associoPlay.controller('playController', ['$scope', '$http', playController]);
associoCreate.controller('createController', ['$scope', '$http', createController]);
associoVis.controller('visController', ['$scope', '$http', visController]);

function edgeListToNodes(root, edges) {
  var nodes = [];
  var links = [];

  var i;
  if (root) {
    nodes.push(root);
  }
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
