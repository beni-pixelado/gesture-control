package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {

	router := gin.Default()

	router.LoadHTMLGlob("templates/*")

	router.Static("/static", "./static")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	router.GET("/PDA", func(c *gin.Context) {
		c.HTML(http.StatusOK, "page-a.html", nil)
	})

	router.GET("/page-b", func(c *gin.Context) {
		c.HTML(http.StatusOK, "page-b.html", nil)
	})

	router.GET("/tracker", func(c *gin.Context) {
		c.HTML(http.StatusOK, "tracker.html", nil)
	})

	router.Run(":8000")
}