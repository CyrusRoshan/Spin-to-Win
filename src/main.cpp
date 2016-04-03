#include <Arduino.h>
#include <Servo.h>

int sensorVal = 0;
int motorPin = 3;
Servo vertical;

void setup() {
    vertical.attach(9);
    pinMode(motorPin, OUTPUT);
    Serial.begin(9600);
    vertical.write(90);
}

void loop() {
    sensorVal = analogRead(A0);

    Serial.print("[");
    Serial.print(sensorVal);
    Serial.println("]");

    delay(70);
}

void serialEvent() {
    if (Serial.available()){
        char inChar = (char)Serial.read();
        if (inChar == 'u'){
            vertical.write(93);
        } else if (inChar == 'U'){
            vertical.write(95);
        } else if (inChar == 'd'){
            vertical.write(85);
        } else if (inChar == 'n'){
            vertical.write(90);
        } else if (inChar == '1'){
          analogWrite(motorPin, 120);
        } else if (inChar == '0'){
          analogWrite(motorPin, 0);
        }
        //Serial.println(millis());
    }
}
