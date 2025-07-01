const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;