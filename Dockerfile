ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

WORKDIR /app

ARG UV_VERSION=latest
COPY --from=ghcr.io/astral-sh/uv:${UV_VERSION} /uv /usr/local/bin/uv

COPY src/pyproject.toml src/uv.lock ./
RUN uv sync --frozen --no-dev

COPY src/ .

ARG APP_PORT=80
ENV APP_PORT=${APP_PORT}
EXPOSE ${APP_PORT}

ENV APP_HOST=0.0.0.0
ENV APP_MODULE=main:app

CMD uvicorn ${APP_MODULE} --host ${APP_HOST} --port ${APP_PORT}
