const Homey = require('homey');
const CAPABILITY_DEBOUNCE = 500;
const TeslaLoggerDevice = require('./device');

class TeslaLoggerDriver extends Homey.Driver {
  async onInit() {
  }


  async onPairListDevices() {

    let devices = [];

    let data = await getVehicles();

    for (let i=0; i<data.length; i++){
      devices.push({
        data: {
          id: data[i].id,
          car_data_name: data[i].name,
          car_data_vin: data[i].vin
        },
        name: data[i].display_name,
        settings: {
        }
      });
    }
    return devices;
  }

  


  }
module.exports = TeslaLoggerDriver;