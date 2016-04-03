module.exports = {
  pointCloud: pointCloud,
  outputFormat: outputFormat
}

const fs = require('fs');

const VERTICAL_TIME = 55954; // ms
const VERTICAL_DIST = 6.6 // cm
const ROTATION_TIME = 4225.5 // ms
const DISTANCE_TO_CENTER = 4.2 //cm
const TOTAL_ROTATIONS = VERTICAL_TIME / ROTATION_TIME;

function pointCloud(oneAxisDistanceTimeMap) { // [(time, distance_from_sensor), ...]
  return oneAxisDistanceTimeMap.map(val => {
    const time = val.time;
    const distanceFromSensor = val.distance;
    const distanceFromCenter = DISTANCE_TO_CENTER - distanceFromSensor;
    const cartesianTime = time % ROTATION_TIME;
    const cartesianCoor = get2DCoor(distanceFromCenter, cartesianTime, ROTATION_TIME);
    const x = cartesianCoor[0];
    const y = cartesianCoor[1];
    const z = (VERTICAL_DIST / VERTICAL_TIME) * time;
    return [x, y, z];
  })
}

function get2DCoor(distanceFromCenter, time, rotTime) {
  const timeRadius = rotTime / (2 * Math.PI);
  const angle = time / timeRadius;
  const px = distanceFromCenter * Math.cos(angle);
  const py = distanceFromCenter * Math.sin(angle);
  return [px, py];
}

function outputFormat(data) {
  var init = data.reduce((prev, curr) => {
    return prev.concat(
      `{${curr[0]},${curr[1]},${curr[2]}},`
    )
  }, '{')

  var bracketFinal = init.split('')
  bracketFinal[init.length - 1] = '}';
  bracketFinal = bracketFinal.join('')
  return bracketFinal;
}

/*var data = fs.readFileSync('../test.dat');
data = JSON.parse(data);
var dataMap = pointCloud(data);
dataMap = outputFormat(dataMap);
fs.writeFile('../final.txt', dataMap)*/
