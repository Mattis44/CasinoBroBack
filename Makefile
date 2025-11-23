SHELL := /bin/bash

.PHONY: init init-api init-front clean dev

init: init-api init-front
	@echo "Initialization complete."

init-api:
	@echo "Installation API..."
	cd apps/api && npm install

init-front:
	@echo "Installation FRONT..."
	cd apps/front && npm install

clean:
	@echo "Cleaning up..."
	rm -rf apps/api/node_modules
	rm apps/api/package-lock.json
	rm -rf apps/front/node_modules
	rm apps/front/package-lock.json

dev:
	@echo "Starting development environment..."
	docker-compose up --build --watch