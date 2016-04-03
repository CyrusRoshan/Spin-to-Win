const Promise = require('bluebird');
const co = require('co');
const serialPort = Promise.promisifyAll(require('serialport'));
const SerialPort = serialPort.SerialPort;
const readline = require('readline');

const upTime = -(272852 - 325266) + 3500;
const downTime = -(47131 - 51554);
const spinCycle = 4225;

var scanStart = 0;
var exportData = [];

const arduino = new SerialPort('/dev/cu.usbmodem1411', {
    parser: serialPort.parsers.readline("\n"),
    baudrate: 9600,
    disconnectedCallback: () => {console.alert('Arduino Disconnected, Exiting...'); process.exit(1);}
}, true);

const moveUp = co.wrap(function* () {
  arduino.write('u');
  console.log('moving up');
  yield delay(upTime);
  console.log('reached top');
  arduino.write('n');
});

const moveDown = co.wrap(function* () {
  arduino.write('d');
  console.log('moving down');
  console.log(typeof downTime, downTime);
  yield delay(downTime);
  console.log('reached bottom');
  arduino.write('n');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


arduino.on('data', (data) => {
  if (scanStart) {
    try {
      var rawData = JSON.parse(data)[0];
      exportData.push([rawData, Date.now() - scanStart]);
    } catch (e) {};
  }
});

rl.on('line', (cmd) => {
  console.log(Date.now());
  if (cmd === 'u') {
    arduino.writeAsync('u');
  }
  else if (cmd === 'd') {
    arduino.writeAsync('d');
  }
  else if (cmd === 'n') {
    arduino.writeAsync('n');
  }
  else if (cmd === 'up') {
    moveUp();
  } else if (cmd === 'down') {
    moveDown();
  } else if (cmd === '1') {
    arduino.writeAsync('1');
    console.log('set to spinning')
  } else if (cmd === '0') {
    arduino.writeAsync('0');
    console.log('stopped spinning');
  } else if (cmd === 'scan') {
    co(function* () {
      arduino.write('u');
      console.log('started scanning');
      var delayTime = delay(upTime);
      scanStart = Date.now();
      yield delayTime;
      arduino.write('n');
      console.log('done scanning, logging data here:');
      console.log(exportData);
      exportData = [];
      scanStart = 0;
    }).catch(console.log);
  } else if (cmd === 'mscan') {
    scanStart = Date.now();
  } else if (cmd === 'sscan') {
    console.log('done scanning, logging data here:');
    console.log(exportData);
    exportData = [];
    scanStart = 0;
  }
});

function delay(time) {
  return new Promise(function (fulfill) {
    setTimeout(fulfill, time);
  });
}
