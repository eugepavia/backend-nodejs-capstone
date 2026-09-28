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
            return res.status(400).json({'error':'Email already registered'});
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
		
        // Create JWT authentication if passwords match
        const payload = {user:{id:newUser.insertedId}};
        const authtoken = jwt.sign(payload,secretKey,{expiresIn:'1h'});
		
        // Log the successful registration 
        logger.info('User registered successfully');

        res.status(201).json({authtoken,email});
    } catch (e) {
        logger.error('oops something went wrong', e);
        return res.status(500).send('Internal server error');
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        // Connect to MongoDB server
        const db = await connectToDatabase();

        // Retrieve users collection
        const collection = db.collection('users');

        const email = req.body.email;
        const password = req.body.password;

        // Check if user already registered in database
        const registeredUser = await collection.findOne({'email':email});
        if (!registeredUser) {
            logger.error('User not found');
            return res.status(400).json({'error':'User not found'});
        }

		// Check if the password matches the encrypted password
        let resultPassword = await bcryptjs.compare(password,registeredUser.password);
        if (!resultPassword) {
            logger.error('Invalid credentials');
            return res.status(400).json({'error':'Invalid credentials'});
        }

        // Fetch user details from database
        const userName = registeredUser.firstName;
        const userEmail = registeredUser.email;

		// Create JWT authentication if passwords match
        const payload = {user:{id:registeredUser._id.toString()}};
        const authtoken = jwt.sign(payload,secretKey,{expiresIn:'1h'});
        
        res.status(200).json({authtoken, userName, userEmail });
    } catch (e) {
        logger.error('oops something went wrong', e);
        return res.status(500).send('Internal server error');

    }
});


module.exports = router;
