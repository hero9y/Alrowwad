const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student',
        required: true
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    receiptNumber: { type: String, required: true, unique: true },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Installment = mongoose.model('Installment', installmentSchema);

module.exports = Installment;