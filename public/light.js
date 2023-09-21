const API_URL = 'http://localhost:4000';

const dataTable = $('#example').DataTable();

$.get(`${API_URL}/api/devices`)
  .then(response => {
    response.forEach(device => {
      const data = device.sensorData.length > 0? device.sensorData[device.sensorData.length - 1].Status: 0;
      dataTable.row.add([
        device.id,
        data
      ]);
    });
    
    dataTable.draw();
  })
  .catch(error => {
    console.error(`Error: ${error}`);
  });

  $('#update-device').on('submit', () => {
    const id = $('#id').val();
    const sensorData = {};
  
    const body = {
      id,
      sensorData
    };
  
    $.post(`${API_URL}/insertdevice`, body)
      .then(response => {
        location.href = '/';
      })
      .catch(error => {
        console.error(`Error: ${error}`);
      });
  });

