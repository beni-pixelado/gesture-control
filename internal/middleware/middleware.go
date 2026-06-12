package middleware

import (
	"github.com/gin-gonic/gin"
)

// TODO: implement real JWT validation.
// Current validation rejects any request without authorization header,
// but accept any value - including invalid tokens. This is a placeholder.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")

		if token == "" {

			c.AbortWithStatus(401)
			return
		}

		// TODO: Validate JWT here (check signature, expiration, claims).
		// Suggestion: github.com/golang-jwt/jwt/v5

		c.Next()
	}
}