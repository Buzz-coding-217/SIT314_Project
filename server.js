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

  // Replace 'mqtt/ec2/test' with the desired MQTT topic to subscribe to
  const topic = 'mqtt/ec2/3021';

  // Subscribe to the MQTT topic
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Error subscribing to MQTT topic:', err);
    } else {
      console.log(`Subscribed to MQTT topic: ${topic}`);
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`Received message from MQTT topic ${topic}: ${message.toString()}`);
  const data = {Status: `${message.toString()}`};
  insertSensorData("3021", data);
});

// Handle MQTT connection errors
client.on('error', (err) => {
  console.error('MQTT connection error:', err);
});

// Handle MQTT disconnections
client.on('close', () => {
  console.log('Disconnected from HiveMQ MQTT broker');
});

app.post('/insert', async (req, res) => {
  try {
    const insertedId = await StoreData(req.body);
    res.status(201).json({ message: 'Data inserted successfully', insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting data' });
  }
});

// Function to send data to the sensorData array using the API
// async function sendDataToDevice(deviceId, sensorData) {
//   try {
//     // Define the API endpoint URL
//     const apiUrl = `http://localhost:4000/api/devices/${deviceId}/sensor-data`;

//     // Make an HTTP POST request to the API
//     const response = await axios.post(apiUrl, sensorData);

//     // Check if the request was successful
//     if (response.status === 201) {
//       console.log('Sensor data added successfully.');
//     } else {
//       console.error('Failed to add sensor data.');
//     }
//   } catch (error) {
//     console.error('Error sending data:', error);
//   }
// }

// const deviceId = '3021';
// const sensorData = { State: "ON" };
// sendDataToDevice(deviceId, sensorData);

// async function insertSensorData(deviceId, data) {
//   try {
//     // Define the API endpoint
//     const apiUrl = `http://localhost:4000/api/devices/${deviceId}`;

//     // Make a POST request to insert data into the "SensorData" array
//     const response = await axios.post(apiUrl, { data });

//     if (response.status === 200) {
//       console.log('Data inserted successfully:', response.data.message);
//     } else {
//       console.error('Failed to insert data:', response.data.message);
//     }
//   } catch (error) {
//     console.error('Error inserting data:', error.message);
//   }
// }

async function insertSensorData(deviceId, data) {
  try {
    // Define the API endpoint
    const apiUrl = `http://localhost:4000/api/devices/${deviceId}`;

    // Prepare the request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Create a request object
    const request = http.request(apiUrl, options, (response) => {
      let responseData = '';

      // Handle data chunks as they come in
      response.on('data', (chunk) => {
        responseData += chunk;
      });

      // Handle the end of the response
      response.on('end', () => {
        if (response.statusCode === 200) {
          console.log('Data inserted successfully:', responseData);
        } else {
          console.error('Failed to insert data:', responseData);
        }
      });
    });

    // Handle errors
    request.on('error', (error) => {
      console.error('Error inserting data:', error.message);
    });

    // Send the data
    request.write(JSON.stringify({ data }));
    request.end();
  } catch (error) {
    console.error('Error inserting data:', error.message);
  }
}

const deviceId = '3021';
const dataToAdd = { Status: "ON" };

insertSensorData(deviceId, dataToAdd);

// setInterval(loadtest, 3000);
// function loadtest()
// {
//     http.get('http://54.237.184.124:3000', (res) => {
//           res.on('data', function (chunk) {
//                 console.log('' + chunk);
//             });
// }); }

app.get('/',  (req, res) => {
  res.sendFile(`${base}/light.html`);
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});


// setInterval(async () => {
//   try {
//     const data = { 
//         id:"3021",
//         sensorData: {}
//      };
//     const insertedId = await StoreData(data);
//     console.log(`Data inserted with ID: ${insertedId}`);
//   } catch (error) {
//     console.error('Error inserting data:', error);
//   }
// }, 5000);


