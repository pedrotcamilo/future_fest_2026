#!/usr/bin/env bash

docker run -d \
  --name psql_axionphare_dev \
  --network host \
  -v postgres_data:/var/lib/postgresql/data \
  -e POSTGRES_DB=postgres \
  -e POSTGRES_USER=axionphare \
  -e POSTGRES_PASSWORD=123 \
  postgres:16