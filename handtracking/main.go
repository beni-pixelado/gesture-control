package main

import (

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.Static("/static", "./static")

	r.GET("/", func(c *gin.Context) {
	c.File("./static/index.html")
})

	r.Run(":8000")
}