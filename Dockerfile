FROM python:3.9


WORKDIR /code


COPY ./requirements.txt /code/requirements.txt


RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt


COPY ./backend/app /code/app


COPY ./frontend /code/frontend


CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]