var mongoose = require('mongoose');

var MoveSchema = new mongoose.Schema({
  root: String,
  game_id: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
  template_id: {type: mongoose.Schema.Types.ObjectId, ref: "Template"},
  node_a: String,
  node_b: String,
  correct: Boolean,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Move', MoveSchema);