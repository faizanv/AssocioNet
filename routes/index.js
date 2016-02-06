var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Template = require('../models/Template.js');
var Move = require('../models/Move.js');
var Game = require('../models/Game.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'AssocioNet' });
});

// Angular App for creating a puzzle template
router.get('/create', function (req, res) {
  res.sendfile('public/create.html');
});

// Angular App for playing a puzzle
router.get('/play', function (req, res) {
  res.sendfile('public/play.html');
});

router.get('/select', function(req, res) {
  Template.find(function(err, templates) {
    if (err) {
      res.send(err);
    } else {
      res.render('select', templates);
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
router.post('/template/:template_id/add', function (req, res) {

  if (req.body.node_a && req.body.node_b) {

    Template.findOneAndUpdate(
      { _id: req.params.template_id },
      { $push: {
        'edges': {
          'node_a': req.body.node_a,
          'node_b': req.body.node_b
        }
      }}
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

// router.get('/template', function(req, res) {
//   Template.find(function(e, ret) {
//     res.send(ret);
//   });
// });

// Delete move from template
router.post('/template/:template_id/delete', function (req, res) {
  res.send({});
});

// Make move in game
router.post('/play/:template_id', function (req, res) {
  res.send({});
});

function sendBadRequest(res, message) {
  res.status(400).send({error: message});
}

module.exports = router;
