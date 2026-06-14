package models
 
import "time"
 
type Note struct {
	// ID é a chave primária — GORM cria como SERIAL/autoincrement por padrão.
	ID uint `gorm:"primaryKey;autoIncrement"`
 
	// UserID armazena o identificador do usuário dono da nota.
	// Vem do campo "user" injetado pelo AuthMiddleware no contexto Gin.
	UserID string `gorm:"not null;index"`
 
	Title   string `gorm:"not null"`
	Content string `gorm:"not null"`
 
	CreatedAt time.Time
	UpdatedAt time.Time
}
 