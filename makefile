run:
	go run ./backend/cmd/server

build:
	go build -o ./bin/gesture-control ./backend/cmd/server

test:
	go test ./...

clean:
	rm -rf ./bin/

.PHONY: run build test clean