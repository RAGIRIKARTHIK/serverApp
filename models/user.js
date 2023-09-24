const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required : true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    imageUrl: String,
    publicId: String,
  },
});

module.exports = mongoose.model('User', userSchema);
