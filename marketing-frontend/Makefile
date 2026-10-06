PORT ?= 4321
.PHONY: install dev check build run preview deploy
install:
	bun install --frozen-lockfile
dev:
	bun run dev --port $(PORT)
check:
	bun run check
build:
	bun run build
run:
	@test -n "$(SCRIPT)" || (echo "Usage: make run SCRIPT=<script> [ARGS=...]" && exit 1)
	bun run "$(SCRIPT)" $(ARGS)
preview:
	bun run preview --port $(PORT)
deploy:
	bun run deploy
