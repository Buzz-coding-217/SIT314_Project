const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const http = require('http');
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker.hivemq.com');
const app = express();
const port = 3000;
const base = `${__dirname}/public`;

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'SmartLightning';

app.use(express.static('public'));

async function StoreData(data) {
    try {
        const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
        await client.connect();

        const db = client.db(dbName);

        const collection = db.collection('SensorData');

        const result = await collection.insertOne(data);

        client.close();

        return result.insertedId;
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Error inserting data into MongoDB');
    }
}

client.on('connect', () => {
    console.log('Connected to HiveMQ MQTT broker');
    const topics = ['mqtt/ec2/3021', 'mqtt/RP/4322', 'mqtt/RP/231', 'mqtt/RP/#'];

    topics.forEach((topic) => {
        client.subscribe(topic, (err) => {
            if (err) {
                console.error(`Error subscribing to MQTT topic: ${topic}`, err);
            } else {
                console.log(`Subscribed to MQTT topic: ${topic}`);
            }
        });
    });
});

app.post('/insert', async (req, res) => {
    try {
        const insertedId = await StoreData(req.body);
        res.status(201).json({ message: 'Data inserted successfully', insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Error inserting data' });
    }
});

client.on('message', (topic, message) => {
    console.log(`Received message from MQTT topic ${topic}: ${message.toString()}`);
    const sensorID = topic.split('/').pop();

    const data = { Status: message.toString()};
    insertSensorData(sensorID, data);
});

async function insertSensorData(deviceId, data) {
    try {
        const apiUrl = `http://localhost:4000/api/devices/${deviceId}`;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const request = http.request(apiUrl, options, (response) => {
            let responseData = '';
            response.on('data', (chunk) => {
                responseData += chunk;
            });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    console.log('Data inserted successfully:', responseData);
                } else {
                    console.error('Failed to insert data:', responseData);
                }
            });
        });
        request.on('error', (error) => {
            console.error('Error inserting data:', error.message);
        });
        request.write(JSON.stringify({ data }));
        request.end();
    } catch (error) {
        console.error('Error inserting data:', error.message);
    }
}

app.get('/',  (req, res) => {
    res.sendFile(`${base}/light.html`);
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
