var mongoose = require('mongoose');

var TemplateSchema = new mongoose.Schema({
  root: String,
  session_id: String,
  edges: [{
    node_a: String,
    node_b: String
  }],
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Template', TemplateSchema);