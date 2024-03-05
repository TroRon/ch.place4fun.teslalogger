"use strict";
const Homey = require('homey');

module.exports = class MediaDriver extends Homey.Driver {

  onPair(session) {
    this.log("onPair()");

    session.setHandler("list_devices", async () => {
        return await this.onPairListDevices(session);
    });
  } // end onPair

  async onPairListDevices(session) {
    this.log("onPairListDevices()" );
    let devices = [];
    let cars = this.homey.drivers.getDriver('car').getDevices();
    for (let i=0; i<cars.length; i++){
        devices.push(
        {
            name: cars[i].getName() + " " + this.homey.__('pair.location.name'),
            data: {
                id: cars[i].getData().id,
                car_data_vin: cars[i].getData().car_data_vin
            },
            settings:{
            }
        }
        );
    }
    this.log("Found devices:");
    this.log(devices);
    return devices;
  }

}