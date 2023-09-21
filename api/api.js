const express = require('express');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const port = 4000;
const Device = require('./models/device');

mongoose.connect('mongodb://localhost:27017/SmartLightning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/api/test', (req, res) => {
  res.send('The API is working!');
});

app.get('/api/devices/:device', async (req, res) => {
  const deviceid = req.params.device; // Use req.params.device to access the parameter
  const device = await Device.findOne({ id: deviceid });

  if (!device) {
    return res.status(404).send({ message: 'Device not found' });
  }

  res.status(200).send(device);
});


app.get('/api/devices', async (req, res) => {
  const device = await Device.find({});
  res.status(200).send(device);
})

app.post('/api/devices/:deviceId', async (req, res) => {
  const deviceId = req.params.deviceId;
  const dataToAdd = req.body.data;

  try {
    const device = await Device.findOne({ id: deviceId });
    console.log(device);
    if (!device) {
      return res.status(404).send({ message: 'Device not found' });
    }
    device.sensorData.push(dataToAdd);

    // Save the updated device document
    await device.save();

    res.status(200).send({ message: 'Data added to SensorData array successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.post('/insertdevice', async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).send(device);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`listening on port ${port}`);
});