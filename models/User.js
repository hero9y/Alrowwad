const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verificationCode: { type: String, default: '200102' }
});

const User = mongoose.model('User', userSchema);

module.exports = User;