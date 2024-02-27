(() => {
  const HR_SERVICE = 0x180D;
  const HR_UUID = 0x2A37;
  const MOTION_SERVICE = 0xFFA0;
  const MOTION_UUID = 0xFFA3;
  const GPS_SERVICE = 0x1819;
  const LAT_UUID = 0x2AAE;
  const LON_UUID = 0x2AAF;
  const TIME_UUID = 0x2A2B;

  function setupAdvertising() {
    /*
     * This function prepares BLE advertisement.
     */

    NRF.setAdvertising(
      {
        0x180D: undefined,
        0x1819: undefined,
        0xFFA0: undefined,
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
      0x1819: { // gps
        0x2AAE: {
          notify: true,
          value: [0,0,0,0], // lat
        },
        0x2AAF: {
          notify: true,
          value: [0,0,0,0], // lon
        },
        0x2A2B: {
          notify: true,
          value: [0,0,0,0,0,0,0,0,0,0,0,0,0], // time
        }
      },
      0xFFA0: {
        0xFFA3: {
          value: 0,
          notify: true,
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


  function updateGPS(fix) {
    /*
     * Send updated gps measurement via BLE
     */
    if (fix === undefined || fix.fix === 0) return;

    var latBuffer = new ArrayBuffer(4);
    var latView = new Uint32Array(latBuffer);
    latView[0] = Math.floor(fix.lat * 10000);

    var lonBuffer = new ArrayBuffer(4);
    var lonView = new Uint32Array(lonBuffer);
    lonView[0] = Math.floor(fix.lon * 10000);

    var timeBuffer = new ArrayBuffer(8);
    var timeView = new DataView(timeBuffer);
    var currentTime = Date.now().toString();
    var dateArray = [];

    for (var i = 0; i < 13; i++) {
        dateArray.push(parseInt(currentTime.charAt(i)));
    }

    try {
      NRF.updateServices({
        0x1819: {
          0x2AAE: {
            value: latBuffer,
            notify: true,
          },
          0x2AAF: {
            value: lonBuffer,
            notify: true,
          },
          0x2A2B: {
            value: dateArray,
            notify: true,
          },
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

  function updateMotion(xyz) {
    if (xyz === undefined) return;

    var d2 = [
      Math.round(xyz.x*100) * Math.round(xyz.x*100),
      Math.round(xyz.y*100) * Math.round(xyz.y*100),
      Math.round(xyz.z*100) * Math.round(xyz.z*100)
    ];
    var abs_acc = Math.sqrt(d2[0] + d2[1] + d2[2]) - 100;
    if (abs_acc < 0) { abs_acc = 0; }

    try {
      NRF.updateServices({
        0xFFA0: {
          0xFFA3: {
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
  }


  setupAdvertising();
  Bangle.setHRMPower(1);
  Bangle.setGPSPower(1);
  Bangle.on("HRM", function (hrm) { updateHRM(hrm); });
  Bangle.on("accel", function (xyz) { updateMotion(xyz); });
  Bangle.on("GPS", function(fix) { updateGPS(fix); });

})();