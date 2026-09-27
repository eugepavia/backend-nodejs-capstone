const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        // Connect to MongoDB server
        const db = await connectToDatabase();
        console.log('connected to db')

        const collection = db.collection('secondChanceItems');
        console.log('collection retrieved')

        // Initialize the query object
        let query = {};

        // Name filter to the query if the name parameter is not empty
        if (req.query.name && req.query.name.trim() !== '') {
            console.log('inside name filter')
            query.name = { $regex: req.query.name, $options: "i" }; // Using regex for partial match, case-insensitive
        }
        console.log('query name:',req.query.name)

        // Other filters 
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition; 
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }

        console.log('query:',query)

        // Fetch filtered gifts
        const gifts = await collection.find(query).toArray();

        res.status(200).json(gifts);
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e)
    }
});

module.exports = router;
