var mongoose = require('mongoose');

var GameSchema = new mongoose.Schema({
  session_id: String,
  template_id: {type: mongoose.Schema.Types.ObjectId, ref: "Template"},
  status: String,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Game', GameSchema);