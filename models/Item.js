const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: String,
    income: Number,
    expense: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);