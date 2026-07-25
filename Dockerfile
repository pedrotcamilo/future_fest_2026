FROM python:3.14-slim

WORKDIR /app

COPY src/pyproject.toml src/uv.lock ./
RUN pip install --no-cache-dir .

COPY src/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
