# ECE140-WI25-Lab4

Run the command below to build the docker image and start the server:

```
docker-compose up --build
```

You should then get some terminal output showing that the server is running, just like what we've seen in Lab Session 1.

**Note**: If you make changes to `main.py`, you'll need to restart the server by pressing `Ctrl+C` in the terminal and running the command above again.

You can then navigate to `http://localhost:8000/docs` to see the API documentation and test the API.

Also, if you open up Docker Desktop, you'll be able to see the running container.

## Instructions

Please see the Lab Session 4 slides posted on Canvas.

**Note**: If you receive a permission denied error when connecting to MySQL, we recommend changing the port mapping from `3306:3306` to `3307:3306` in the docker-compose YAML file.

### Part 1: Get All Stocks

1. Go to `app/main.py`
2. Now, find the TODO in `get_stocks()` and fill the query to get all stocks from the database.

### Part 2: Create A New Stock

1. Go to `app/main.py`
2. Now, find the TODO in `create_stock()` and fill the query to get all stocks from the database.

### Part 3: Get One Stock

1. Go to `app/main.py`
2. Now, find the TODO in `get_stock()` and fill the query to get all stocks from the database.

### Part 4: Delete One Stock

1. Go to `app/main.py`
2. Now, find the TODO in `delete_stock()` and fill the query to get all stocks from the database.

### Part 5: Test it out

1. Go to `http://localhost:8000/docs`
2. Test out the API by creating, getting, and deleting stocks. You should see successful (200) responses, and your database should be updated accordingly.