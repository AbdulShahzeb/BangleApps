(() => {
    const HR_SERVICE = 0x180D;
    const HR_UUID = 0x2A37;
    const MOTION_SERVICE = "00030000-78fc-48fe-8e23-433b3a1942d0";
    const MOTION_UUID = "00030002-78fc-48fe-8e23-433b3a1942d0";
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
          HR_SERVICE: undefined,
          GPS_SERVICE: undefined,
          MOTION_SERVICE: undefined
          
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
        HR_SERVICE: { // heart_rate
          HR_UUID: {
            notify: true,
            value: [0x06, 0],
          },
          0x2A38: { // Sensor Location: Wrist
            value: 0x02,
          }
        },
        GPS_SERVICE: {
          LAT_UUID: {
            notify: true,
            value: 0,
          },
          LON_UUID: {
            notify: true,
            value: 0,
          },
          TIME_UUID: {
            notify: true,
            value: 0,
          }
        },
        MOTION_SERVICE: {
          MOTION_UUID: {
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
          HR_SERVICE: {
            HR_UUID: {
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

    function updateMotion(xyz) {
      /*
       * Send updated motion measurement via BLE
       */
      if (xyz === undefined) return;

      var abs_acc = Math.sqrt(accel.x*accel.x + accel.y*accel.y + accel.z*accel.z) - 100;
      if (abs_acc < 0) { abs_acc = 0; };

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
          /*
           * BLE has to restart after service setup.  
           */
          NRF.disconnect();
        } else {
          console.log("[fall_detection]: Unexpected error occured while updating Motion over BLE! Error: " + error.message);
        }
      }
    }

    function updateGPS(fix) {
      /*
       * Send updated gps measurement via BLE
       */
      if (fix === undefined || fix.fix === 0) return;

      try {
        NRF.updateServices({
          GPS_SERVICE: {
            LAT_UUID: {
              value: fix.lat,
              notify: true,
            },
            LON_UUID: {
              value: fix.lon,
              notify: true,
            },
            TIME_UUID: {
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
    Bangle.on("accel", function(xyz) { updateMotion(xyz); });
    bangle.on("GPS", function(fix) { updateGPS(fix); });

  })();