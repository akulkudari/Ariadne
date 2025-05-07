# Ariadne

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