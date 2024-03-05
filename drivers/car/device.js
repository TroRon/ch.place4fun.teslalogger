const Homey = require('homey');
const PiholeDevice = require('./device'); // Stellen Sie sicher, dass der Pfad korrekt ist.
const CAPABILITY_DEBOUNCE = 500;

//Festlegen einer Map für die Task-Verwaltung
let intervalIds = new Map();

module.exports = class CarDevice extends Homey.Device {

    async onInit() {

      //DEBUG Mode
      if (process.env.DEBUG === '1'){
        try{ 
          require('inspector').waitForDebugger();
        }
        catch(error){
          require('inspector').open(9225, '0.0.0.0', true);
        }
      }
 
      this.log('Gerät wurde initialisiert');
      
      //Ansprechen der Einstellungen, damit Zugriff darauf gewährleistet ist
      const deviceSettings = this.getSettings();
            
   // Prüfen, ob Geräteeinstellungen vorhanden sind
   if (deviceSettings) {

      //Die nötigen Einstellungen holen und bereitstellen
      const device_url = deviceSettings.url
      const device_port = deviceSettings.port
      const device_carID = deviceSettings.carID
      const device_interval = deviceSettings.interval

      //Schreiben ins Log File
      this.log('*******************************************************')
      this.log('Driver ID: car');
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

      //Capabilities Listener
       this.registerMultipleCapabilityListener(this.getCapabilities(), async (capabilityValues, capabilityOptions) => {
        // try{
            await this._onCapability( capabilityValues, capabilityOptions);
        // }
        // catch(error){
        //     this.log("_onCapability() Error: ",error);
        // }
      },CAPABILITY_DEBOUNCE);

      let deviceSettingsArray = [
        {
          url: device_url,
          port: device_port,
          carID: device_carID,
          interval: device_interval,
        },
      ]; 

      deviceSettingsArray.forEach(deviceSettings => {
        const status_url = `${device_url}:${device_port}/debug/TeslaAPI/${device_carID}/vehicle_data`;
             
        // Erstellen des wiederkehrenden Tasks
        const deviceId = this.getId();
        
        //Task neu erstellen
        this.createTask(deviceId)
      });

      //Schreibt den Status, bei Veränderung, ins Log File
      this.registerCapabilityListener('onoff', async (value) => {
      this.log('Eingeschaltet:' ,value);
      const deviceId = this.getData().id;

      //Reagiert darauf, wenn das Gerät nicht erreichbar ist
      this.setUnavailable(this.homey.__('device.unavailable')).catch(this.error);

      if (value) {
        this.log('Eingeschaltet:' ,value);
        this._makeAPICall(enable_url)
      } else {
        this.log('Ausgeschaltet:' ,value);
        this._makeAPICall(disable_url)
      }
      }
    )
      } else {
        this.log('Keine Geräteeinstellungen gefunden. Aktionen werden nicht ausgeführt.');
    }
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

  if (changedKeys.includes('url'))
  {
        // 'url' wurde geändert
        this.log(`[Device] ${this.getName()}: URL-Einstellung geändert: ${newSettings.url}`);

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

  if (changedKeys.includes('port'))
  {
        // 'port' wurde geändert
        this.log(`[Device] ${this.getName()}: Port-Einstellung geändert: ${newSettings.port}`);

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
  
  if (changedKeys.includes('carID'))
  {
        // 'url' wurde geändert
        this.log(`[Device] ${this.getName()}: CarID-Einstellung geändert: ${newSettings.carID}`);

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

  //Ansprechen der Einstellungen, damit Zugriff darauf gewähleistet ist
  const deviceSettings = this.getSettings();
             
  //Die nötigen Einstellungen holen und bereitstellen
  const device_url = deviceSettings.url
  const device_port = deviceSettings.port
  const device_carID = deviceSettings.carID
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

  if( capabilityValues["car_data_refresh"] != undefined){
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
      let vehicle_version = data.response.vehicle_state.car_version
      let vehicle_state = data.response.state
      let vehicle_service = data.response.in_service
      let vehicle_odometer_miles = data.response.vehicle_state.odometer
      let vehicle_sentry = data.response.vehicle_state.sentry_mode
      let vehicle_tpms_fl = data.response.vehicle_state.tpms_pressure_fl
      let vehicle_tpms_fr = data.response.vehicle_state.tpms_pressure_fr
      let vehicle_tpms_rl = data.response.vehicle_state.tpms_pressure_rl
      let vehicle_tpms_rr = data.response.vehicle_state.tpms_pressure_rr
  
      //Nachführen der VIN
      this._addDeviceInformations(vehicle_name, vehicle_vin)

      ///Nötige Umrechnungen
      //Umrechnen von Meilen in KM
      let vehicle_odometer = vehicle_odometer_miles * 1.60934;
  
      // Loggen der Werte zwecks Diagnose
      this.log('');
      this.log('*******************************************************');
      this.log('Task Geräte Abgleich: GESTARTET');
      this.log('Aktuelles Gerät:',deviceName);
      this.log('');
      this.log('Allgemeine Fahrzeugdaten')
      this.log('Fahrzeugname:',vehicle_name)
      this.log('VIN:',vehicle_vin)
      this.log('Software:',vehicle_version)
      this.log('Status:',vehicle_state)
      this.log('Odometer:',vehicle_odometer, 'km')
      this.log('Service Mode:',vehicle_service)
      this.log('Sentry Mode:',vehicle_sentry)
      this.log('Reifendrücke: FL:',vehicle_tpms_fl , 'FR:',vehicle_tpms_fr , 'RL:',vehicle_tpms_rl , 'RR:',vehicle_tpms_rr)
      this.log('Task Geräte Abgleich: BEENDET');
      this.log('*******************************************************');
      this.log('');

      //Fehlerüberprüfung, sollte UNDEFINED zurückkommen
      if (typeof formattedSyncDate !== 'undefined') {
        this.setCapabilityValue('car_last_update', formattedSyncDate);
      } else {
        this.log('Fehler --> formattedSyncDate ist nicht definiert');
        this.setCapabilityValue('car_last_update', 'n/a');
      }

      if (typeof vehicle_name !== 'undefined') {
        this.setCapabilityValue('car_name', vehicle_name);
      } else {
        this.log('Fehler --> vehicle_name ist nicht definiert');
        this.setCapabilityValue('car_name', 'n/a');
      }

      if (typeof vehicle_vin !== 'undefined') {
        this.setCapabilityValue('car_vin', vehicle_vin);
      } else {
        this.log('Fehler --> vehicle_vin ist nicht definiert');
        this.setCapabilityValue('car_vin', 'n/a');
      }

      if (typeof vehicle_version !== 'undefined') {
        this.setCapabilityValue('car_software_version', vehicle_version);
      } else {
        this.log('Fehler --> vehicle_version ist nicht definiert');
        this.setCapabilityValue('car_software_version', 'n/a');
      }

      if (typeof vehicle_state !== 'undefined') {
        this.setCapabilityValue('car_state', vehicle_state);
      } else {
        this.log('Fehler --> car_state ist nicht definiert');
        this.setCapabilityValue('car_state', 'n/a');
      }
      
      if (typeof vehicle_odometer !== 'undefined') {
        this.setCapabilityValue('meter_car_odo', vehicle_odometer);
      } else {
        this.log('Fehler --> meter_car_odo ist nicht definiert');
        this.setCapabilityValue('meter_car_odo', 'n/a');
      }

      if (typeof vehicle_service !== 'undefined') {
        this.setCapabilityValue('car_service_mode', vehicle_service);
      } else {
        this.log('Fehler --> car_service_mode ist nicht definiert');
        this.setCapabilityValue('car_service_mode', 'n/a');
      }

      if (typeof vehicle_sentry !== 'undefined') {
        this.setCapabilityValue('car_sentry_mode', vehicle_sentry);
      } else {
        this.log('Fehler --> car_sentry_mode ist nicht definiert');
        this.setCapabilityValue('car_sentry_mode', 'n/a');
      }

      if (typeof vehicle_tpms_fl !== 'undefined') {
        this.setCapabilityValue('measure_car_tpms_pressure_fl', vehicle_tpms_fl);
      } else {
        this.log('Fehler --> measure_car_tpms_pressure_fl ist nicht definiert');
        this.setCapabilityValue('measure_car_tpms_pressure_fl', 'n/a');
      }

      if (typeof vehicle_tpms_fr !== 'undefined') {
        this.setCapabilityValue('measure_car_tpms_pressure_fr', vehicle_tpms_fr);
      } else {
        this.log('Fehler --> measure_car_tpms_pressure_fr ist nicht definiert');
        this.setCapabilityValue('measure_car_tpms_pressure_fr', 'n/a');
      }
      
      if (typeof vehicle_tpms_rl !== 'undefined') {
        this.setCapabilityValue('measure_car_tpms_pressure_rl', vehicle_tpms_rl);
      } else {
        this.log('Fehler --> measure_car_tpms_pressure_rl ist nicht definiert');
        this.setCapabilityValue('measure_car_tpms_pressure_rl', 'n/a');
      }

      if (typeof vehicle_tpms_rr !== 'undefined') {
        this.setCapabilityValue('measure_car_tpms_pressure_rr', vehicle_tpms_rr);
      } else {
        this.log('Fehler --> measure_car_tpms_pressure_rr ist nicht definiert');
        this.setCapabilityValue('measure_car_tpms_pressure_rr', 'n/a');
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
  
    // Vorhandenes Intervall beenden, falls es bereits existiert
    const existingIntervalId = intervalIds.get(deviceId);
    if (existingIntervalId) {
      clearInterval(existingIntervalId);
      intervalIds.delete(deviceId); // Entferne das Intervall aus der Map
    }
  
    // Ansprechen der Einstellungen, um darauf zugreifen zu können
    const deviceSettings = this.getSettings();
  
    // Die nötigen Einstellungen holen und bereitstellen
    const device_url = deviceSettings.url;
    const device_port = deviceSettings.port;
    const device_carID = deviceSettings.carID;
  
    // Bereitstellen der nötigen URLs für Aktionen / Abfragen
    const status_url = `${device_url}:${device_port}/debug/TeslaAPI/${device_carID}/vehicle_data`;
  
    // Die nötigen Einstellungen holen und bereitstellen
    const device_interval = deviceSettings.interval;
  
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