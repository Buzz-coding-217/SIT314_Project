const mongoose = require('mongoose');

module.exports = mongoose.model('Device', new mongoose.Schema({
  id: String,
  sensorData: Array
}, { collection: 'SensorData' }));