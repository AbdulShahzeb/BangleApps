(() => {
  const HR_SERVICE = 0x180D;
  const HR_UUID = 0x2A37;
  //const MOTION_SERVICE = "00030000-78fc-48fe-8e23-433b3a1942d0";
  //const MOTION_UUID = "00030002-78fc-48fe-8e23-433b3a1942d0";
  const GPS_SERVICE = 0x1819;
  const LAT_UUID = 0x2AAE;
  const LON_UUID = 0x2AAF;
  const TIME_UUID = 0x2A2B;

  function setupAdvertising() {
    /*
     * This function prepares BLE heart rate Advertisement.
     */

    NRF.setAdvertising(
      {
        0x180D: undefined,
        0x1819: undefined,
      },
      {
        // Set up advertisement settings
        connectable: true,
        discoverable: true,
        scannable: true,
        whenConnected: true,
      }
    );

    NRF.setServices({
      0x180D: { // heart_rate
        0x2A37: {
          notify: true,
          value: [0x06, 0],
        },
        0x2A38: { // Sensor Location: Wrist
          value: 0x02,
        }
      },
      0x1819: {
        0x2AAE: {
          notify: true,
          value: 0,
        },
        0x2AAF: {
          notify: true,
          value: 0,
        },
        0x2A2B: {
          notify: true,
          value: 0,
        }
      }
    });
  }


  function updateHRM(hrm) {
    /*
     * Send updated heart rate measurement via BLE
     */
    if (hrm === undefined || hrm.confidence < 50) return;
    try {
      NRF.updateServices({
        0x180D: {
          0x2A37: {
            value: [0x06, hrm.bpm],
            notify: true
          },
          0x2A38: {
            value: 0x02,
          }
        }
      });
    } catch (error) {
      if (error.message.includes("BLE restart")) {
        /*
         * BLE has to restart after service setup.  
         */
        NRF.disconnect();
      } else {
        console.log("[fall_detection]: Unexpected error occured while updating HRM over BLE! Error: " + error.message);
      }
    }
  }

  /*function updateMotion(xyz) {
    if (xyz === undefined) return;

    var abs_acc = Math.sqrt(accel.x*accel.x + accel.y*accel.y + accel.z*accel.z) - 100;
    if (abs_acc < 0) { abs_acc = 0; }

    try {
      NRF.updateServices({
        MOTION_SERVICE: {
          MOTION_UUID: {
            value: abs_acc,
            notify: true
          }
        }
      });
    } catch (error) {
      if (error.message.includes("BLE restart")) {
        NRF.disconnect();
      } else {
        console.log("[fall_detection]: Unexpected error occured while updating Motion over BLE! Error: " + error.message);
      }
    }
  }*/

  function updateGPS(fix) {
    /*
     * Send updated gps measurement via BLE
     */
    if (fix === undefined || fix.fix === 0) return;

    try {
      NRF.updateServices({
        0x1819: {
          0x2AAE: {
            value: fix.lat,
            notify: true,
          },
          0x2AAF: {
            value: fix.lon,
            notify: true,
          },
          0x2A2B: {
            value: fix.time,
            notify: true,
          }
        }
      });
    } catch (error) {
      if (error.message.includes("BLE restart")) {
        /*
         * BLE has to restart after service setup.  
         */
        NRF.disconnect();
      } else {
        console.log("[fall_detection]: Unexpected error occured while updating GPS over BLE! Error: " + error.message);
      }
    }
  }

  setupAdvertising();
  Bangle.setHRMPower(1);
  Bangle.setGPSPower(1);
  Bangle.on("HRM", function (hrm) { updateHRM(hrm); });
  //Bangle.on("accel", function(xyz) { updateMotion(xyz); });
  Bangle.on("GPS", function(fix) { updateGPS(fix); });

})();