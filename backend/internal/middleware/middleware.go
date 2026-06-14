package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type SessionResponse struct {
	User any `json:"user"`
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		authURL := strings.TrimRight(os.Getenv("VITE_NEON_AUTH_URL"), "/")
		if authURL == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "VITE_NEON_AUTH_URL não configurado",
			})
			return
		}

		req, err := http.NewRequest(
			http.MethodGet,
			authURL+"/get-session",
			nil,
		)
		if err != nil {
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		// Repassa todos os cookies do navegador
		req.Header.Set("Cookie", c.Request.Header.Get("Cookie"))

		// Repassa o User-Agent
		req.Header.Set("User-Agent", c.Request.UserAgent())

		client := &http.Client{}

		resp, err := client.Do(req)
		if err != nil {
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		var session SessionResponse

		if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		if session.User == nil {
			c.Redirect(http.StatusTemporaryRedirect, "/")
			c.Abort()
			return
		}

		// Disponibiliza o usuário para os handlers
		c.Set("user", session.User)

		c.Next()
	}
}