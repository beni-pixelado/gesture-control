package database
 
import (
	"fmt"
	"os"
 
	"github.com/beni-pixelado/gesture-control/backend/internal/models"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)
 
// DB é a instância global do GORM, acessada pelos handlers.
var DB *gorm.DB
 
func Init() {
	// Carrega o .env se existir (ignora erro — em produção as vars já estarão no ambiente)
	_ = godotenv.Load()
 
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		panic("DATABASE_URL não encontrado no ambiente")
	}
 
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		panic("falha ao conectar ao banco: " + err.Error())
	}
 
	// AutoMigrate cria/atualiza a tabela notes sem deletar dados existentes.
	// Adicione aqui outros models futuros conforme o projeto crescer.
	if err := db.AutoMigrate(&models.Note{}); err != nil {
		panic("falha no AutoMigrate: " + err.Error())
	}
 
	DB = db
	fmt.Println("Banco de dados conectado e migrado")
}