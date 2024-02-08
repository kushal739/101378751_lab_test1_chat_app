const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from_user: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  date_sent:{
    type: Date,
    default: Date.now,
  }

});

const GroupMessage = mongoose.model("messages", MessageSchema);
module.exports = GroupMessage;