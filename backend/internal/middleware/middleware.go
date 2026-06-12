package middleware

import (
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {

        token := c.GetHeader("Authorization")

        if token == "" {
            c.AbortWithStatus(401)
            return
        }

        // validar JWT aqui

        c.Next()
    }
}