#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// Initialize the LCD with I2C address 0x27, 16 columns and 2 rows
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  // Initialize the LCD
  lcd.init();
  // Turn on the backlight
  lcd.backlight();
}

void loop() {
  // Wait for a second
  delay(1000);

  // Set cursor to first column, first row
  lcd.setCursor(0, 0);
  // Print text on the top row
  lcd.print("Hello, From");

  // Set cursor to first column, second row
  lcd.setCursor(0, 1);
  // Print text on the bottom row
  lcd.print("Arduino_uno_guy");
}

