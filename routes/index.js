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
        'edges': {
          'node_a': req.body.node_a,
          'node_b': req.body.node_b
        }
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
          Move.find({
            game_id: game._id
          }).exec(function (err, moves) {
            if (err) {
              sendBadRequest(res, err);
            } else {
              res.send({
                game: game,
                moves: moves
              });
            }
          });

        // Make a new one otherwise
        } else {
          var game = new Game({
            session_id: session.id,
            template_id: req.template._id,
            root: req.template.root
          });
          game.save();

          session.game_id = game.id;
          res.send({game: game});
        }
      }
    });

  // Make a new game if none yet in session
  } else {
    var game = new Game({
      session_id: session.id,
      template_id: req.template._id,
      root: req.template.root
    });
    game.save();

    session.game_id = game.id;
    res.send({game: game});
  }
});

// Make move in game
router.post('/play/:template/move', function (req, res) {
  var session = req.session;
  var game_id = req.session.game_id;

  if (game_id) {
    if (req.body.node_a && req.body.node_b) {

      Move.findOne({
          template_id: req.template._id,
          game_id: game_id,
          $or: [
            { 
              node_a: req.body.node_a,
              node_b: req.body.node_b
            }, { 
              node_a: req.body.node_b,
              node_b: req.body.node_a
            }
          ]
      }).exec(function (err, move) {
        if (err) {
          sendBadRequest(res, err);

        // If the move has already been made, just return it
        } else if (move) {
          console.log("Move has already been made");
          res.send({move: move});

        // Check if the move is a correct solution, then add it
        } else {

          var i = 0;
          var valid = false;
          while (i < req.template.edges.length && !valid) {
            var edge = req.template.edges[i];

            // If the move is valid
            if ((req.body.node_a == edge.node_a && req.body.node_b == edge.node_b) ||
              (req.body.node_a == edge.node_b && req.body.node_b == edge.node_a)) {
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
              node_a: req.body.node_a,
              node_b: req.body.node_b,
              correct: valid
          });
          move.save(function (err) {
            if (err) {
              sendBadRequest(res, err);
            } else {
              res.send({move: move});
            }
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

function sendBadRequest(res, message) {
  res.status(400).send({error: message});
}

module.exports = router;
