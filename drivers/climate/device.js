const Homey = require('homey');
const ChildDevice = require('../child_device');
const CAPABILITY_DEBOUNCE = 500;

//Festlegen einer Map für die Task-Verwaltung
let intervalIds = new Map();

module.exports = class ClimateDevice extends ChildDevice {

  async onInit() {
    await super.onInit();
    this._settings = this.getSettings();

    this.log('Gerät wurde initialisiert');
    
    //Bereitstellen der Geräte Einstellungen  
    try {
      const carData = this.getCarDevice();
    
      //Die nötigen Einstellungen holen und bereitstellen
      const device_url = carData.url
      const device_port = carData.port
      const device_carID = carData.carID
      const device_interval = carData.interval

      //Schreiben ins Log File
      this.log('*******************************************************')
      this.log('Driver ID: climate');
      this.log('URL   ->', device_url);
      this.log('Port  ->', device_port);
      this.log('CarID ->', device_carID);
      this.log('Akt.  ->', device_interval, 'Minute(n)');
      this.log('*******************************************************')

      
      //Bereitstellen der nötigen URLs für Aktionen / Abfragen
      const status_url = `${device_url}:${device_port}/debug/TeslaAPI/${device_carID}/vehicle_data`;

      //Schreiben ins Log File
      this.log('URL Status  ->', status_url);
  
      
      //Capabilities Updaten (Danke Ronny Winkler)
      await this._updateCapabilities();

      // Erstellen des wiederkehrenden Tasks
      const deviceId = this.getId();
        
      //Task neu erstellen
      this.createTask(deviceId)

    } catch (error) {
      this.log(error.message);
    }
  }


  //Hilfsfunktionen
  getCarDevice(){
    let device = this.homey.drivers.getDriver('car').getDevices().find(e => e.getData().id === this.getData().id);
    if (!device){
        throw new Error('No car device found.');
    }
    const carData = {
        id: device.getData().id,
        url: device.getSetting('url'),
        port: device.getSetting('port'),
        carID: device.getSetting('carID'),
        interval: device.getSetting('interval'),
    };
    return carData; 
}


/**
   * onAdded is called when the user adds the device, called just after pairing.
   */
async onAdded() {
  this.log('Gerät wurde hinzugefügt' ,value);
}

/**
 * onSettings is called when the user updates the device's settings.
 * @param {object} event the onSettings event data
 * @param {object} event.oldSettings The old settings object
 * @param {object} event.newSettings The new settings object
 * @param {string[]} event.changedKeys An array of keys changed since the previous version
 * @returns {Promise<string|void>} return a custom message that will be displayed
 */
async onSettings({ oldSettings, newSettings, changedKeys }) {
  this.log(`[Device] ${this.getName()}: Einstellung geändert: ${changedKeys}`);
  this._settings = newSettings;

  if (changedKeys.includes('interval')) {
    // 'interval' wurde geändert
    this.log(`[Device] ${this.getName()}: Intervall-Einstellung geändert: ${newSettings.interval} Minute(n)`);

    const deviceId = this.getId();

    //Task löschen
    setTimeout(() => {
      this.deleteTask(deviceId)
    }, 1000); // Verzögerung von einer Sekunde (1000 Millisekunden)


    //Task löschen
    setTimeout(() => {
      this.createTask(deviceId)
    }, 1000); // Verzögerung von einer Sekunde (1000 Millisekunden)

   }
}

/**
 * onRenamed is called when the user updates the device's name.
 * This method can be used this to synchronise the name to the device.
 * @param {string} name The new name
 */
async onRenamed(name) {
  this.log('Gerät wurde umbenannt' ,value);
}

/**
 * onDeleted is called when the user deleted the device.
 */
async onDeleted() {
  const deviceId = this.getId();

  //Task löschen
  this.deleteTask(deviceId)
}

async _updateCapabilities(){
  let capabilities = [];
  try{
    capabilities = this.homey.app.manifest.drivers.filter((e) => {return (e.id == this.driver.id);})[0].capabilities;
    // remove capabilities
    let deviceCapabilities = this.getCapabilities();
    for (let i=0; i<deviceCapabilities.length; i++){
      let filter = capabilities.filter((e) => {return (e == deviceCapabilities[i]);});
      if (filter.length == 0 ){
        try{
          await this.removeCapability(deviceCapabilities[i]);
        }
        catch(error){}
      }
    }
    // add missing capabilities
    for (let i=0; i<capabilities.length; i++){
      if (!this.hasCapability(capabilities[i])){
        try{
          await this.addCapability(capabilities[i]);
        }
        catch(error){}
      }
    }
  }
  catch (error){
    this.error(error.message);
  }
}

// CAPABILITIES =======================================================================================

async _onCapability( capabilityValues, capabilityOptions){

  //Die nötigen Einstellungen holen und bereitstellen
  const carData = this.getCarDevice();
  const device_url = carData.url
  const device_port = carData.port
  const device_carID = carData.carID
  const device_interval = carData.interval
  const device_Name = this.getName()

  //Schreiben ins Log File
  this.log('*******************************************************')
  this.log('ID   ->', device_Name);
  this.log('URL  ->', device_url);
  this.log('Port ->', device_port);
  this.log('Key  ->', device_carID);
  this.log('*******************************************************')

  //Bereitstellen der nötigen URLs für Aktionen / Abfragen
  const status_url = `${device_url}:${device_port}/debug/TeslaAPI/${device_carID}/vehicle_data`;

  if( capabilityValues["climate_data_refresh"] != undefined){
    this._updateDeviceData(status_url);
  }
}

// Helpers =======================================================================================
async _updateDeviceData(url) {

  try {
    const response = await fetch(url);
    // Überprüft, ob der Statuscode im Erfolgsbereich liegt (200-299) oder 403 ist
    if (!response.ok && response.status !== 403) { 
        throw new Error(`Status Filter: ${response.status}`);
    } else {
    }

    const data = await response.json();
  
  fetch(url).then(response => response.json())
  .then(data => {
      
      //Fülle Variable mit Gerätename ab
      const deviceName = this.getName()

      //Datum sauber formatieren
      let syncDate = new Date();
      let day = syncDate.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit', 
        timeZone: this.homey.clock.getTimezone() 
      });
      let time = syncDate.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: this.homey.clock.getTimezone()
      });

      // Datum und Uhrzeit zusammenführen
      let formattedSyncDate = `${time} | ${day}`;

      //Vehicle Information
      let vehicle_name = data.response.vehicle_state.vehicle_name
      let vehicle_vin = data.response.vin
            
      //Klima Informationen
      let vehicle_climate_heat_level_steering_wheel = data.response.climate_state.steering_wheel_heat_level.toString()
      let vehicle_climate_heat_level_seat_fl = data.response.climate_state.seat_heater_left.toString()
      let vehicle_climate_heat_level_seat_fr = data.response.climate_state.seat_heater_right.toString()
      let vehicle_climate_heat_level_seat_rear_left = data.response.climate_state.seat_heater_rear_left.toString()
      let vehicle_climate_heat_level_seat_rear_center = data.response.climate_state.seat_heater_rear_center.toString()
      let vehicle_climate_heat_level_seat_rear_right = data.response.climate_state.seat_heater_rear_right.toString()
      let vehicle_climate_cabin_overheat_protection  = data.response.climate_state.cabin_overheat_protection
      let vehicle_climate_defrost_mode = data.response.climate_state.defrost_mode.toString()
      let vehicle_climate_driver_temp_setting = data.response.climate_state.driver_temp_setting
      let vehicle_climate_passenger_temp_setting = data.response.climate_state.passenger_temp_setting
      let vehicle_climate_state = data.response.climate_state.is_climate_on.toString()
      let vehicle_climate_inside_temp = data.response.climate_state.inside_temp
      let vehicle_climate_outside_temp = data.response.climate_state.outside_temp
      let vehicle_climate_preconditioning_enabled = data.response.charge_state.preconditioning_enabled
      let vehicle_climate_preconditioning_times = data.response.charge_state.preconditioning_times
           
      //Nachführen der VIN
      this._addDeviceInformations(vehicle_name, vehicle_vin)

      // Loggen der Werte zwecks Diagnose
      this.log('');
      this.log('*******************************************************');
      this.log('Task Geräte Abgleich: GESTARTET');
      this.log('Aktuelles Gerät:',deviceName);
      this.log('');
      this.log('Allgemeine Fahrzeugdaten')
      this.log('Fahrzeugname:',vehicle_name)
      this.log('VIN:',vehicle_vin)
      this.log('')
      this.log('Klimatisierungs Daten')
      this.log('Lenkradheizung (Stufe):',vehicle_climate_heat_level_steering_wheel)
      this.log('Sitzheizung Fahrer (Stufe):',vehicle_climate_heat_level_seat_fl)
      this.log('Sitzheizung Beifahrer (Stufe):?',vehicle_climate_heat_level_seat_fr)
      this.log('Sitzheizung hinten LINKS (Stufe):',vehicle_climate_heat_level_seat_rear_left)
      this.log('Sitzheizung hinten MITTE (Stufe):',vehicle_climate_heat_level_seat_rear_center)
      this.log('Sitzheizung hinten RECHTS (Stufe):',vehicle_climate_heat_level_seat_rear_right)
      this.log('Überhitzungs-Schutz aktiv?',vehicle_climate_cabin_overheat_protection)
      this.log('Enteisen aktiv?:',vehicle_climate_defrost_mode)
      this.log('Vorheizen aktiv:',vehicle_climate_preconditioning_enabled)
      this.log('Vorheizen wann:',vehicle_climate_preconditioning_times)
      this.log('Temperatur Fahrer:',vehicle_climate_driver_temp_setting)
      this.log('Temperatur Beifahrer:',vehicle_climate_passenger_temp_setting)
      this.log('Klima-Anlage aktiv?',vehicle_climate_state)
      this.log('Innentemperatur:',vehicle_climate_inside_temp,'Grad')
      this.log('Aussentemperatur:',vehicle_climate_outside_temp,'Grad')
      this.log('');
      this.log('Task Geräte Abgleich: BEENDET');
      this.log('*******************************************************');


      

      //Fehlerüberprüfung, sollte UNDEFINED zurückkommen
      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_last_update', formattedSyncDate);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_last_update', 'n/a');
      }

      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_seat_fl_heat_level', vehicle_climate_heat_level_seat_fl);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_seat_fl_heat_level', 'n/a');

      }

      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_seat_fr_heat_level', vehicle_climate_heat_level_seat_fr);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_seat_fr_heat_level', 'n/a');

      }

      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_seat_rear_left_level', vehicle_climate_heat_level_seat_rear_left);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_seat_rear_left_level', 'n/a');

      }

      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_seat_rear_center_level', vehicle_climate_heat_level_seat_rear_center);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_seat_rear_center_level', 'n/a');
      }

      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('climate_seat_rear_right_level', vehicle_climate_heat_level_seat_rear_right);
      } else {
        this.log('Fehler --> last_sync ist nicht definiert');
        this.setCapabilityValue('climate_seat_rear_right_level', 'n/a');
      }
      
      if (typeof vehicle_climate_preconditioning_enabled !== 'undefined') {
        this.setCapabilityValue('climate_preconditioning', vehicle_climate_preconditioning_enabled);
      } else {
        this.log('Fehler --> climate_preconditioning ist nicht definiert');
        this.setCapabilityValue('climate_preconditioning', 'n/a');
      }

      if (typeof vehicle_climate_preconditioning_times !== 'undefined') {
        this.setCapabilityValue('climate_preconditioning_times', vehicle_climate_preconditioning_times);
      } else {
        this.log('Fehler --> climate_preconditioning_times ist nicht definiert');
        this.setCapabilityValue('climate_preconditioning_times', 'n/a');
      }

      if (typeof vehicle_climate_cabin_overheat_protection !== 'undefined') {
        this.setCapabilityValue('climate_cabin_overheat_protection', vehicle_climate_cabin_overheat_protection);
      } else {
        this.log('Fehler --> climate_cabin_overheat_protection ist nicht definiert');
        this.setCapabilityValue('climate_cabin_overheat_protection', 'n/a');
      }

      if (typeof vehicle_climate_defrost_mode !== 'undefined') {
        this.setCapabilityValue('climate_defrost_mode', vehicle_climate_defrost_mode);
      } else {
        this.log('Fehler --> climate_defrost_mode ist nicht definiert');
        this.setCapabilityValue('climate_defrost_mode', 'n/a');
      }

      if (typeof vehicle_climate_driver_temp_setting !== 'undefined') {
        this.setCapabilityValue('climate_driver_temp_setting', vehicle_climate_driver_temp_setting);
      } else {
        this.log('Fehler --> car_driver_temp_setting, ist nicht definiert');
        this.setCapabilityValue('climate_driver_temp_setting', 'n/a');
      }

      if (typeof vehicle_climate_passenger_temp_setting !== 'undefined') {
        this.setCapabilityValue('climate_passenger_temp_setting', vehicle_climate_passenger_temp_setting);
      } else {
        this.log('Fehler --> climate_passenger_temp_setting ist nicht definiert');
        this.setCapabilityValue('climate_passenger_temp_setting', 'n/a');
      }

      if (typeof vehicle_climate_state !== 'undefined') {
        this.setCapabilityValue('climate_aircondition_state', vehicle_climate_state);
      } else {
        this.log('Fehler --> climate_aircondition_state ist nicht definiert');
        this.setCapabilityValue('climate_aircondition_state', 'n/a');
      }

      if (typeof vehicle_climate_outside_temp !== 'undefined') {
        this.setCapabilityValue('measure_climate_temperature_out', vehicle_climate_outside_temp);
      } else {
        this.log('Fehler --> measure_climate_temperature_out ist nicht definiert');
        this.setCapabilityValue('measure_climate_temperature_out', 'n/a');
      }

      if (typeof vehicle_climate_inside_temp !== 'undefined') {
        this.setCapabilityValue('measure_climate_temperature_in', vehicle_climate_inside_temp);
      } else {
        this.log('Fehler --> measure_climate_temperature_in ist nicht definiert');
        this.setCapabilityValue('measure_climate_temperature_in', 'n/a');
      }

    // Capabilities für den Rest setzen
    this.setCapabilityValue('alarm_api_error', false);

});
} catch (error) {
  this.log('Ein Fehler ist aufgetreten ->', error.message);
  
  // Jetzt können Sie Capabilities für dieses Gerät setzen
  this.setCapabilityValue('alarm_api_error', true);
}
} 


//TASK Verwaltung
async deleteTask(deviceId) {

  //Zugreifen auf die nötigen Informationen
  const carData = this.getCarDevice();
  const device_url = carData.url
  const device_port = carData.port
  const device_carID = carData.carID
  const device_interval = carData.interval
  
  // Überprüfen, ob für die deviceId ein Task existiert
  if (intervalIds.has(deviceId)) {
    // Hole die intervalId und stoppe das Intervall
    clearInterval(intervalIds.get(deviceId));
    this.log('Task für Gerät' ,deviceId, 'gestoppt.');

    // Entferne die intervalId aus der Map
    intervalIds.delete(deviceId);
    this.log('Task für Gerät' ,deviceId, 'gelöscht.');

  } else {
    this.log('Kein Task gefunden für Gerät' ,deviceId,);
  }
}

async createTask(deviceId) {

    //Zugreifen auf die nötigen Informationen
    
    //Die nötigen Einstellungen holen und bereitstellen
    const carData = this.getCarDevice();
    const device_url = carData.url
    const device_port = carData.port
    const device_carID = carData.carID
    const device_interval = carData.interval

  
    // Vorhandenes Intervall beenden, falls es bereits existiert
    const existingIntervalId = intervalIds.get(deviceId);
    if (existingIntervalId) {
      clearInterval(existingIntervalId);
      intervalIds.delete(deviceId); // Entferne das Intervall aus der Map
    }
  
    // Ansprechen der Einstellungen, um darauf zugreifen zu können
    const deviceSettings = this.getSettings();
  
    // Bereitstellen der nötigen URLs für Aktionen / Abfragen
    const status_url = `${device_url}:${device_port}/debug/TeslaAPI/${device_carID}/vehicle_data`;
  
  
    // Umrechnen der Interval ID in Millisekunden
    const device_interval_minutes = device_interval; // Der Wert von device_interval in Minuten
    const device_interval_milliseconds = device_interval_minutes * 60000;
  
    // Erstelle einen neuen Task (z.B. eine Funktion, die regelmäßig ausgeführt wird)
    const intervalId = setInterval(() => {
      this._updateDeviceData(status_url);
    }, device_interval_milliseconds); // gem. eingestelltem Intervall
  
    // Speichere die neue intervalId in der Map
    intervalIds.set(deviceId, intervalId);
    this.log('Neuer Task erstellt für Gerät:', deviceId);
}



async _addDeviceInformations(car_name, car_vin) {
  //Nachführen der VIN und des Namens des Geräte-Objekts
  const settings = this.getSettings();
  
  // Initialisiere ein Objekt, um mögliche Änderungen zu speichern
  let updateSettings = {};
  
  // Überprüfe, ob car_data_name leer ist
  if (!settings.car_data_name) {
    // Bereite die Einstellung car_data_name vor, wenn sie leer ist
    updateSettings.car_data_name = car_name;
    this.log('Neues Gerät, ohne Namen, Name wird korrekt gesetzt');
  }

  // Überprüfe, ob car_data_vin leer ist
  if (!settings.car_data_vin) {
    // Bereite die Einstellung car_data_vin vor, wenn sie leer ist
    updateSettings.car_data_vin = car_vin;
   this.log('Neues Gerät, ohne VIN, VIN wird korrekt gesetzt');
  }

  // Aktualisiere die Einstellungen, wenn Änderungen vorhanden sind
  if (Object.keys(updateSettings).length > 0) {
    this.setSettings(updateSettings)
    .then(() => {
      this.log('Einstellungen wurden erfolgreich aktualisiert');
    })
    .catch(err => {
      this.log('Fehler beim Aktualisieren der Einstellungen:', err);
    });
  }
} 





}


