package database

import (
	"context"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/jackc/pgx/v5"
)

var DB *pgx.Conn


func Init() {

	godotenv.Load("../.env")

	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		panic("DATABASE_URL not founded in environment variables")
	}

	conn, err := pgx.Connect(
		context.Background(),
		databaseURL,
	)

	if err != nil {
		panic(fmt.Sprintf("erro ao conectar ao banco: %v", err))
	}

	DB = conn

	fmt.Println("Banco conectado com sucesso!")
}