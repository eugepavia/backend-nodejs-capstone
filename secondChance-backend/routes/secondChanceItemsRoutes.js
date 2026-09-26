const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });



// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Fetch all secondChangeItems, chained with toArray() method
        const secondChanceItems = await collection.find({}).toArray();

        // Return secondChangeItems
        res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/',upload.single('file'), async(req, res,next) => {
    try {

        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Create a new secondChangeItem
        let secondChanceItem = req.body;

        // Get last id, increment 1 and set it to new item
        const lastItem = await collection.find().sort({'id':-1}).limit(1);
        secondChanceItem.id = (parseInt(lastItem.id) + 1).toString();

        // Set current date to new item
        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added

        // Add new item to database
        secondChanceItem = await collection.insertOne(secondChanceItem);

        // Return confirmation
        return res.status(201).json(secondChanceItem.ops[0]);

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {

        let id = req.params.id;

        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Find item by id
        let itemById = await collection.findOne({'id':id});

        //Return message if not found
        if (!itemById) {
            logger.error('Item not found');
            return res.status(404).json({error:'Item not found'});
        }    
        
        // Return item if found
        return res.status(200).json(itemById);

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    try {

        let id = req.params.id;

        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Find item by id
        let itemById = await collection.findOne({'id':id});

        //Return message if not found
        if (!itemById) {
            logger.error('Item not found');
            return res.status(404).json({error:'Item not found'});
        }

        // If found, update attributes
        itemById.category = req.body.category;
        itemById.condition = req.body.condition;
        itemById.age_days = req.body.age_days;
        itemById.description = req.body.description;
        itemById.age_years = Number((itemById.age_days / 365).toFixed(1));
        itemById.updatedAt = new Date();
        // itemById.updatedAt = Math.floor(new Date().getTime() / 1000);

        const updatedItem = await collection.findOneAndUpdate({'id':id},{'$set':itemById},{returnDocument:'after'});

        // Send confirmation
        if (updatedItem) {
            return res.status(200).json({'update':'success'});
        } else {
            logger.error('Upload failed');
            return res.status(400).json({'update':'failed'});
        }

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        
        let id = req.params.id;

        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Find item by id
        let itemById = await collection.findOne({'id':id});

        //Return message if not found
        if (!itemById) {
            logger.error('Item not found');
            return res.status(404).json({error:'Item not found'});
        }

        // Delete item
        await collection.deleteOne({'id':id});

        return res.status(200).json({'delete':'success'});

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

module.exports = router;
