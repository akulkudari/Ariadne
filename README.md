# Ariadne: A Smart Hiking Stick

Product Summary: Ariadne is a Smart Hiking Stick with many features including navigation, health monitoring via heartrate and pulse oximetry, step and distance tracking, environmental readings, and waypoint marking to provide hikers with advanced safety and information on hikes. Our device syncs wirelessly to the internet when a connection is available to upload all data to your account, where you can view it via our corresponding web application. If you're not connected to the internet, the device has onboard storage, via an SD card, where your data like location, heart rate, temperature, and waypoints are stored, so that when you come back online, it syncs with your account and uploads this data.

Run the command below to build the docker image and start the server:

```
docker-compose up --build
```

You should then get some terminal output showing that the server is running, just like what we've seen in Lab Session 1.

**Note**: If you make changes to `main.py`, you'll need to restart the server by pressing `Ctrl+C` in the terminal and running the command above again.

You can then navigate to `http://localhost:8000/docs` to see the API documentation and test the API.

Also, if you open up Docker Desktop, you'll be able to see the running container.

### Part 5: Test it out

1. Go to `http://localhost:8000/docs`
2. Test out the API by creating, getting, and deleting stocks. You should see successful (200) responses, and your database should be updated accordingly.
