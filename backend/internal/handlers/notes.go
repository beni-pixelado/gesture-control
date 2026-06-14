// backend/internal/handlers/notes.go

package handlers

import (
	"net/http"

	"github.com/beni-pixelado/gesture-control/backend/internal/database"
	"github.com/beni-pixelado/gesture-control/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// PDAPage busca as notas do usuário logado e renderiza a página PDA.
func PDAPage(c *gin.Context) {
	userID := extractUserID(c)

	var notes []models.Note
	database.DB.
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&notes)

	c.HTML(http.StatusOK, "PDA.html", gin.H{
		"Notes": notes,
	})
}

// NewNoteForm exibe o template com os inputs de título e conteúdo.
func NewNoteForm(c *gin.Context) {
	c.HTML(http.StatusOK, "new-note.html", nil)
}

// CreateNote lê os campos do form, valida e persiste no banco.
func CreateNote(c *gin.Context) {
	title := c.PostForm("title")
	content := c.PostForm("content")

	if title == "" || content == "" {
		c.HTML(http.StatusBadRequest, "new-note.html", gin.H{
			"Error": "Título e conteúdo são obrigatórios.",
		})
		return
	}

	note := models.Note{
		UserID:  extractUserID(c),
		Title:   title,
		Content: content,
	}

	if result := database.DB.Create(&note); result.Error != nil {
		c.HTML(http.StatusInternalServerError, "new-note.html", gin.H{
			"Error": "Erro ao salvar a nota. Tente novamente.",
		})
		return
	}

	c.Redirect(http.StatusSeeOther, "/PDA")
}

// extractUserID é um helper para pegar o ID do usuário injetado pelo AuthMiddleware.
// O Neon Auth retorna o user como map[string]interface{} com o campo "id".
func extractUserID(c *gin.Context) string {
	rawUser, _ := c.Get("user")
	if userMap, ok := rawUser.(map[string]interface{}); ok {
		if id, ok := userMap["id"].(string); ok {
			return id
		}
	}
	return ""
}