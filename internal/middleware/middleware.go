package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/beni-pixelado/gesture-control/internal/database"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware verifica se o request tem um cookie de sessão válido.
//
// O better-auth (usado pelo neon-auth) armazena sessões na tabela "session"
// do banco Neon com as colunas "token" e "expiresAt".
// O cookie enviado pelo cliente se chama "better-auth.session_token".
//
// Fluxo:
//  1. Lê o cookie
//  2. Busca o token no banco
//  3. Verifica se não expirou
//  4. Autoriza ou redireciona para o login
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// O nome do cookie é definido pelo better-auth internamente
		token, err := c.Cookie("better-auth.session_token")
		if err != nil || token == "" {
			// Sem cookie — manda para o login
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		// Busca a sessão no banco pelo token
		var expiresAt time.Time
		err = database.DB.QueryRow(
			context.Background(),
			"SELECT \"expiresAt\" FROM session WHERE token = $1",
			token,
		).Scan(&expiresAt)

		if err != nil {
			// Token não encontrado no banco
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		if time.Now().After(expiresAt) {
			// Sessão expirada
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		// Sessão válida — continua
		c.Next()
	}
}