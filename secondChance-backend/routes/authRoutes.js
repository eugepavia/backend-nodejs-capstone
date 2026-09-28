const dotenv = require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const pino = require('pino');
const logger = pino();

const secretKey = process.env.JWT_SECRET;

// Register new user
router.post('/register', async (req, res) => {
    try {
        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve users collection
        const collection = db.collection('users');

        const email = req.body.email;
        const password = req.body.password;
       
        // Check if user already exists
        const existingEmail = await collection.findOne({'email':email});
        if(existingEmail) {
            logger.error('Email alredy registered');
            return res.status(400).json({'message':'Email already registered'});
        }
		
		// Hash to encrypt the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        // Insert the user into the database
        const newUser = await collection.insertOne({
            email: email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date()
        })
		
        // Create JWT authentication if passwords match with user._id as payload
        const payload = {user:{id:newUser.insertedId}}
        const authtoken = jwt.sign(payload,secretKey,{expiresIn:'1h'});
		
        // Log the successful registration 
        logger.info('User registered successfully');

        res.status(201).json({authtoken,email});
    } catch (e) {
        logger.error('oops something went wrong', e);
        return res.status(500).send('Internal server error');
    }
});


module.exports = router;
