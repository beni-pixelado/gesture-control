package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
)

var DB *pgx.Conn

func Init() {
    _ = godotenv.Load()

    databaseURL := os.Getenv("DATABASE_URL")

    if databaseURL == "" {
        panic("DATABASE_URL not founded")
    }

    conn, err := pgx.Connect(context.Background(), databaseURL)
    if err != nil {
        panic(err)
    }

    DB = conn
    fmt.Println("Database connected")
}