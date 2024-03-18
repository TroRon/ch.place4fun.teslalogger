'use strict';

const { triggerAsyncId } = require('async_hooks');
const Homey = require('homey');

class TeslaLogger extends Homey.App {
  async onInit() {

    if (process.env.DEBUG === '1'){
      try{ 
        require('inspector').waitForDebugger();
      }
      catch(error){
        require('inspector').open(9225, '0.0.0.0', true);
      }
  }

  //Schreibe ins Log
  this.log(`${Homey.manifest.id}-${Homey.manifest.version}-Initialization ....`);

  await super.onInit();

  //Aktions-Karten
  //pihole-disable-piholes.json


  //Bereich für Triggerkarten
  //alarm_core_update_available_true.json
//  this._coreUpdateAvailable = this.homey.flow.getTriggerCard('alarm_core_update_available_true')
//    this._coreUpdateAvailable.registerRunListener(async (args, state) => {
//      try{

//        await args.device.device(this.getName());
//        await args.device.service('Core');
//        return true;
//      }
//      catch(error){
//        this.error("Error executing flowAction 'alarm_core_update_available_true': "+  error.message);
//        throw new Error(error.message);
//      }
//    });

  
}
}

module.exports = TeslaLogger;
