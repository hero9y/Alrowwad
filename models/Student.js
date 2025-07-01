const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    region: { type: String, required: true },
    parentPhone: { type: String, required: true },
    lineName: { type: String, required: true },
    grade: {
        type: String,
        required: true,
        enum: ['Sixth Grade Science', 'Sixth Grade Literature', 'Sixth Grade Vocational']
    },
    lineOwnerNumber: { type: String, required: true },
    subjects: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
    }],
    installments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Installment'
    }],
    createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;