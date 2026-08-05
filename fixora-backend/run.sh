#!/usr/bin/env bash
# Loads .env into real environment variables, then starts the backend.
# Spring Boot doesn't read .env files itself (that's a frontend/Vite thing),
# so this is the easy way to use one locally.
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo "No .env found — copy .env.example to .env first."
  exit 1
fi

mvn spring-boot:run
