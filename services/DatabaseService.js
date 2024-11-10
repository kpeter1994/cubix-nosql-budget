// services/DatabaseService.js

const mongoose = require('mongoose');
const redis = require('redis');
const Item = require('../models/Item');

class DatabaseService {
    constructor() {
        mongoose.connect('mongodb://localhost:27017/budget', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        this.redisClient = redis.createClient({
            url: 'redis://localhost:6379'
        });
        this.redisClient.connect();
    }

    saveItem(itemData) {
        const newItem = new Item(itemData);
        return newItem.save();
    }

    async getAllItems() {
        return await Item.find();
    }

}

module.exports = DatabaseService;


