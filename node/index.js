const Promise = require('bluebird');
const co = require('co');
var ncp = require("copy-paste");
const pointCloud = require('./pointCloud');
const serialPort = Promise.promisifyAll(require('serialport'));
const SerialPort = serialPort.SerialPort;
const keypress = require('keypress');
const binarySearch = require('binarysearch');

keypress(process.stdin);
process.stdin.on('keypress', command);
process.stdin.setRawMode(true);
process.stdin.resume();

const blockSize = 0.005;
const functionBestFit = '-600+(19169 x)/30+(30433 x^2)/360-(1751 x^3)/16+(4009 x^4)/144-(727 x^5)/240+(89 x^6)/720';
var scanStart = 0;
var exportData = [];

function convertToJs(z, x){
  z = z.replace(/ x/g, '*x');
  z = z.replace(/x\^(\d*)/g, "Math.pow(x, $1)");
  z = z.replace(/x/g, x);
  return z;
}

var lookupTable = [];

for (var i = 1; i < 5.1; i += blockSize) {
  lookupTable.push(eval(convertToJs(functionBestFit, i)));
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
      var dataPoint = ({data: rawData, distance: binarySearch.closest(lookupTable, rawData) * blockSize, time: Date.now() - scanStart});
      if (dataPoint.distance <= 5) { //cutoff point, everything else is assumed to be thin air
        exportData.push(dataPoint);
      }
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
      arduino.writeAsync('1');
      if (scanStart) {
        console.log('Scan already in progress, end with "q"');
      } else {
        arduino.writeAsync('u');
        console.log('Scan started, end with "q"');
        scanStart = Date.now();
      }
      break;
    case 'q':
      arduino.writeAsync('0');
      if (exportData.length) {
        arduino.writeAsync('n')
        console.log('Done scanning, logging data here:\n\n\n');
        var data = pointCloud.pointCloud(exportData);
        ncp.copy('testData ={Point[' + pointCloud.outputFormat(data) + ']};' +
        '(*newData = {Point[{0,0,0},{1,0,0},{0,1,0},{1,1,0},{0,0,1},{1,0,1}, {0,1,1},{1,1,1},{.5,.5,.5}]};*)' +
'Graphics3D[testData]' +
'(*ListSurfacePlot3D[testData,AxesLabel -> {"x", "y", "z"}]*)' +
'(*CloudDeploy[APIFunction[{"data" -> "String"}, Permissions ->"Public", createObj, Graphics3D]]*)', function () {
console.log('copied to board');
})
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
