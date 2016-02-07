var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Template = require('../models/Template.js');
var Move = require('../models/Move.js');
var Game = require('../models/Game.js');

router.param('template', function (req, res, next, id) {
  Template.findOne({
    _id: id
  }).exec( function (err, template) {
    if (err) {
      sendBadRequest(res, err);
    } else {
      req.template = template;

      return next();
    }
  });
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'AssocioNet' });
});

// Angular App for creating a puzzle template
router.get('/create', function (req, res) {
  res.sendfile('public/create.html');
});

router.get('/select', function(req, res) {
  Template.find(function(err, templates) {
    if (err) {
      res.send(err);
    } else {
      res.render('select', {content: templates});
    }
  });
});

// Create new template for session
router.post('/create', function (req, res) {
  var session = req.session;

  // Store Template.id in session
  if (session.template_id) {
    Template.findOne({_id: session.template_id}).exec( function (err, template) {
      res.send({template: template});
    });
  } else {
    var template = new Template({
      session_id: session.id
    });
    template.save();

    session.template_id = template.id;
    res.send({template: template});
  }
});

// Add move to template
router.post('/template/:template/add', function (req, res) {

  // Initialize the root node
  if (req.body.root) {
    Template.findOneAndUpdate(
      { _id: req.template._id },
      { $set: {
        root: req.body.root
      }},
      { new: true }
    ).exec(function (err, template) {
      if (err) {
        sendBadRequest(res, err);
      } else {
        res.send({template: template});
      }
    });
  } else if (req.body.node_a && req.body.node_b) {

    Template.findOneAndUpdate(
      { _id: req.template._id },
      { $push: {
        edges: filteredEdgeFromStrings(req.body.node_a, req.body.node_b)
      }},
      { new: true }
    ).exec(function (err, template) {

      if (err) {
        sendBadRequest(res, err);
      } else {
        res.send({template: template});
      }
    });
  } else {
    sendBadRequest(res, "node_a and node_b required for move");
  }
});

router.get('/template/:template', function (req, res) {
  res.send({template: req.template});      
});

// Delete move from template
router.post('/template/:template/delete', function (req, res) {
  res.send({});
});

// Angular App for playing a puzzle
router.get('/play/:template', function (req, res) {
  res.render('play', {template_id: req.template._id});
});

// Initialize game in background
router.post('/play/:template', function (req, res) {
  var session = req.session;

  // Store Game.id in session 
  if (session.game_id) {

    // Get the matching game from the session
    Game.findOne({
      _id: session.game_id,
      template_id: req.template._id
    }).exec( function (err, game) {
      if (err) {
        sendBadRequest(res, err);
      } else {

        // If a game exists, retreive its moves
        if (game) {
          console.log("Existing game")  ;

          Move.find({
            template_id: req.template._id,
            game_id: game._id
          }).exec(function (err, moves) {
            if (err) {
              sendBadRequest(res, err);
            } else {

              res.send({
                graph: edgeListToRedactedGraph(req.template.root, req.template.edges, moves)
              });
            }
          });

        // Make a new one otherwise
        } else {
          console.log("new game");

          var game = new Game({
            session_id: session.id,
            template_id: req.template._id,
            root: req.template.root
          });

          game.save(function (err, g) {
            session.game_id = game.id;
            
            Move.find({
              template_id: req.template._id,
              game_id: g._id
            }).exec(function (err, moves) {
              res.send({
                graph: edgeListToRedactedGraph(req.template.root, req.template.edges, moves)
              });
            });
         });
        }
      }
    });

  // Make a new game if none yet in session
  } else {
    console.log("New session")  ;

    var game = new Game({
      session_id: session.id,
      template_id: req.template._id,
      root: req.template.root
    });
    session.game_id = game.id;

    game.save(function (err, g) {
      res.send({
        graph: edgeListToRedactedGraph(req.template.root, req.template.edges, [])
      });
    });

  }
});

// Make move in game
router.post('/play/:template/move', function (req, res) {
  var session = req.session;
  var game_id = req.session.game_id;

  if (game_id) {
    if (req.body.node_a && req.body.node_b) {

      var link = filteredEdgeFromStrings(req.body.node_a, req.body.node_b);

      Move.findOne({
          template_id: req.template._id,
          game_id: game_id,
          node_a: link.node_a,
          node_b: link.node_b
      }).exec(function (err, move) {
        if (err) {
          return sendBadRequest(res, err);
        }


        // If the move has already been made, just return it
        if (move) {
          console.log("Move has already been made");

          Move.find({
            template_id: req.template._id,
            game_id: game_id
          }).exec(function (err, moves) {
            res.send({
              move: move,
              graph: edgeListToRedactedGraph(req.template.root, req.template.edges, moves)
            });
          });

        // Check if the move is a correct solution, then add it
        } else {

          var i = 0;
          var valid = false;  
          while (i < req.template.edges.length && !valid) {
            var edge = req.template.edges[i];

            // If the move is valid
            if (link.node_a == edge.node_a && link.node_b == edge.node_b) {
              valid = true;
            }
            i++;
          }

          if (valid) {
            console.log("Path found!");
          } else {
            console.log("Wrong path!");
          }

          var move = new Move({
              template_id: req.template._id,
              game_id: game_id,
              node_a: link.node_a,
              node_b: link.node_b,
              correct: valid
          });

          move.save(function (err, move) {
            if (err) {
              return sendBadRequest(res, err);
            }

            Move.find({
              template_id: req.template._id,
              game_id: game_id
            }).exec(function (err, moves) {

              res.send({
                move: move,
                graph: edgeListToRedactedGraph(req.template.root, req.template.edges, moves)
              });
            });
          });
        }
      });

    } else {  
      sendBadRequest(res, "node_a and node_b required for move");
    }
  } else {
    sendBadRequest(res, "No game for this session");
  }
});

router.get('/associations', function (req, res) {
  Move.aggregate([
  {
    $group: {
      _id: {
        node_a: "$node_a",
        node_b: "$node_b"
      },
      correct: { $sum: { $cond: ["$correct", 1, 0]}},
      count: { $sum:  1 }
    }
  }, {
    $project: {_id: 0, "node_a": "$_id.node_a", "node_b": "$_id.node_b", correct: 1, count: 1}
  }
  ]).exec(function (err, associations) {
    res.send({associations: associations});
  });
});

router.get('/associations/graph', function (req, res) {
  Move.aggregate([
  {
    $group: {
      _id: {
        node_a: "$node_a",
        node_b: "$node_b"
      },
      correct: { $sum: { $cond: ["$correct", 1, 0]}},
      count: { $sum:  1 }
    }
  }, {
    $project: {_id: 0, "node_a": "$_id.node_a", "node_b": "$_id.node_b", correct: 1, count: 1}
  }
  ]).exec(function (err, associations) {
    res.send({
      graph: associationsToGraph(associations)
    });
  });
})

function filteredEdgeFromStrings(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  if (b < a) {
    return {
      node_a: b,
      node_b: a
    }
  } else {
    return {
      node_a: a,
      node_b: b
    }
  }
}

function edgeListToRedactedGraph(root, edges, moves) {
  var nodes = [];
  var links = [];

  var i;
  nodes.push(root);
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
    var node = nodes[i];
    var solved = false;

    // For all the solved nodes
    for (j = 0; !solved && j < moves.length; j++) {
      var move = moves[j];
      // If we have already discovered it

      if (move.node_a == node || move.node_b == node) {
        solved = true;
      }
    }
    if (solved || node == root) {
      nodeList[i] = {name: node};
    } else {
      nodeList[i] = {name: "?"};      
    }
  }

  var result = {
    nodes: nodeList,
    links: links
  };
  console.log(result);
  return result;
}

function associationsToGraph(associations) {
  var nodes = [];
  var links = [];

  var i;
  for (i = 0; i < associations.length; i++) {
    var edge = associations[i];

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
      target: i_nodeB,
      count: edge.count,
      correct: edge.correct
    });

  }
  var nodeList = [];
  
  for (i = 0; i < nodes.length; i++) {
    var node = nodes[i];

    nodeList[i] = {name: node};
  }

  var result = {
    nodes: nodeList,
    links: links
  };
  console.log(result);
  return result;
}

function sendBadRequest(res, message) {
  res.status(400).send({error: message});
}

module.exports = router;
