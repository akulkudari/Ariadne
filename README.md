# Ariadne: A Smart Hiking Stick

In this project we developed a fullstack web application with integration for an IoT enabled Embedded Systems Device which we engineered with the purpose of aiding hikers with data like step counts, elevation, temperature, heartrate, directions, and more. The device would be able to navigate with no data using downloaded directions, and store waypoints in an offline storage card, which would sync to your account when you logged back in and connected to WiFi. We used React for the frontend and FastAPI for the backend API points, as well as MySQL for the backend database and information storage such as user accounts, health data, location data, waypoints etc. For our IoT device we used an Arduino Nano 33 IoT, along with peripherals like a GPS, Pulse Oximeter, LCD Screen, Magnetometer, Temperature and Humidity sensors, and an external 9V rechargeable battery pack for power.

## Table of Contents
1. [Product Summary](#product-summary)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Application Pages](#application-pages)
   - [Landing Page](#landing-page)
   - [Login Page](#login-page)
   - [Dashboard](#dashboard)
   - [Navigation](#navigation)
   - [Waypoints](#waypoints)
   - [Health](#health)
   - [Community](#community)
   - [User Profile](#user-profile)

# Product Summary:
Ariadne is a Smart Hiking Stick with many features including navigation, health monitoring via heartrate and pulse oximetry, step and distance tracking, environmental readings, and waypoint marking to provide hikers with advanced safety and information on hikes. Our device syncs wirelessly to the internet when a connection is available to upload all data to your account, where you can view it via our corresponding web application. If you're not connected to the internet, the device has onboard storage, via an SD card, where your data like location, heart rate, temperature, and waypoints are stored, so that when you come back online, it syncs with your account and uploads this data.

# Backend Setup:

Run the command below to build the docker image and start the server:

```
docker-compose up --build
```

You should then get some terminal output showing that the server is running, just like what we've seen in Lab Session 1.

**Note**: If you make changes to `main.py`, you'll need to restart the server by pressing `Ctrl+C` in the terminal and running the command above again.

You can then navigate to `http://localhost:8000/docs` to see the API documentation and test the API.

Also, if you open up Docker Desktop, you'll be able to see the running container.

## Frontend 
To run the frontend, navigate to the frontend folder in our project directory, and run 
```
npm start 
```
this will start the React website on your local machine, where you can view our website. 
# Landing Page
<img width="1917" height="906" alt="Ariadne Landing Page" src="https://github.com/user-attachments/assets/c88d2153-6b22-4df8-adae-46df6b7f9e73" />

# Login Page
<img width="1915" height="902" alt="Ariadne Login Page" src="https://github.com/user-attachments/assets/cd10f0de-6da4-48a9-a4f5-d7cdbf26169e" />

# Dashboard
<img width="1912" height="898" alt="Ariadne dashboard" src="https://github.com/user-attachments/assets/35d1e089-250b-4818-b7fe-23fbc46e13c5" />

# Navigation
<img width="1907" height="906" alt="Ariadne navigation" src="https://github.com/user-attachments/assets/f49b92a3-e57e-4f99-b334-0e0adcf72a05" />

# Waypoints
<img width="1897" height="893" alt="Ariadne Waypoints" src="https://github.com/user-attachments/assets/468a9f01-878c-4ffb-9673-ffa24b578752" />

# Health
<img width="1915" height="706" alt="Ariadne Health Dashboard" src="https://github.com/user-attachments/assets/6e6270b8-7229-453c-89fd-44ff930fe5ff" />

# Community
<img width="1887" height="903" alt="Ariadne Community" src="https://github.com/user-attachments/assets/caa70bab-c738-4dc8-acf9-32308ca4c89e" />

# User Profile
<img width="1892" height="905" alt="Ariadne Profile" src="https://github.com/user-attachments/assets/ce68a6b7-ff15-47b5-8e97-0c90f4d15493" />


