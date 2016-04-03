const Promise = require('bluebird');
const co = require('co');
const serialPort = Promise.promisifyAll(require('serialport'));
const SerialPort = serialPort.SerialPort;
const keypress = require('keypress');
const binarySearch = require('binarysearch');

keypress(process.stdin);
process.stdin.on('keypress', command);
process.stdin.setRawMode(true);
process.stdin.resume();

var scanStart = 0;
var exportData = [];

function convertToJs(z, x){
  z = z.replace(/ x/g, '*x');
  z = z.replace(/x\^(\d*)/g, "Math.pow(x, $1)");
  z = z.replace(/x/g, x);
  return z;
}

var lookupTable = [];

for (var i = 0; i < 5; i += 0.05) {
  lookupTable.push(eval(convertToJs('', i)));
}

const arduino = new SerialPort('/dev/cu.usbmodem1411', {
  parser: serialPort.parsers.readline("\n"),
  baudrate: 9600,
  disconnectedCallback: () => {console.alert('Arduino Disconnected, Exiting...'); process.exit(1);}
}, true);

const moveUp = co.wrap(function* () {
  arduino.writeAsync('u');
  console.log('moving up');
  yield delay(upTime);
  console.log('reached top');
  arduino.writeAsync('n');
});

const moveDown = co.wrap(function* () {
  arduino.writeAsync('d');
  console.log('moving down');
  console.log(typeof downTime, downTime);
  yield delay(downTime);
  console.log('reached bottom');
  arduino.writeAsync('n');
});

arduino.on('data', (data) => {
  if (scanStart) {
    try {
      var rawData = JSON.parse(data)[0];
      exportData.push({data: rawData, time: Date.now() - scanStart});
    } catch (e) {};
  }
});

function command(key, name) {
  console.log(Date.now());
  if (!isNaN(String(key))) {
    name = {};
    name.name = key; //lmao
  }
  console.log(name.name);
  switch (name.name) {
    case 'c':
      if (!name.ctrl) {
        break;
      }
    case 'escape':
      process.stdin.pause();
      process.exit();
      break;
    case 'u':
      (name.shift) ? arduino.writeAsync('U') : arduino.writeAsync('u');
      break;
    case 'd':
      (name.shift) ? arduino.writeAsync('D') : arduino.writeAsync('d');
      break;
    case 'n':
      arduino.writeAsync('n');
      break;
    case '1':
      arduino.writeAsync('1');
      console.log('Started spinning')
      break;
    case '0':
      arduino.writeAsync('0');
      console.log('Stopped spinning');
      break;
    case 's':
      if (scanStart) {
        console.log('Scan already in progress, end with "q"');
      } else {
        arduino.writeAsync('u')
        console.log('Scan started, end with "q"');
        scanStart = Date.now();
      }
      break;
    case 'q':
      if (exportData.length) {
        arduino.writeAsync('n')
        console.log('Done scanning, logging data here:');
        console.log(exportData);
        exportData = [];
        scanStart = 0;
      } else {
        console.log('No scan has been started. Start one with "s"');
      }
      break;
    default:
      console.log('Not a valid command, valid commands: ^c/esc, u, d, n, 1, 0, s, q');
      break;
  }
}

function delay(time) {
  return new Promise(function (fulfill) {
    setTimeout(fulfill, time);
  });
}
