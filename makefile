run:
	go run ./backend/handtracking
 

build:
	go build -o ./bin/gesture-control ./backend/handtracking
 

test:
	go test ./...
 

clean:
	rm -rf ./bin/
 
.PHONY: run build test clean