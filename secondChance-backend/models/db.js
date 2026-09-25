// db.js
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;

let dbInstance = null;
const dbName = `${process.env.MONGO_DB}`;

async function connectToDatabase() {
    if (dbInstance){
        return dbInstance
    };

    try {
        // Creating a new MongoClient instance
        const client = new MongoClient(url);      

        // Connect to MongoDB server
        await client.connect();
        console.log("Connected to MongoDB server");

        // Connect to database giftDB
        dbInstance = client.db('giftDB');

        // Return database instance
        return dbInstance;
        
    } catch (err) {
        console.log('An error ocurred with the database connection');
        console.log(err);
    }
    
}

module.exports = connectToDatabase; 