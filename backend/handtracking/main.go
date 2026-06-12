package main

import (
	"net/http"

	"github.com/beni-pixelado/gesture-control/internal/database"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	router := gin.Default()

	router.LoadHTMLGlob("handtracking/templates/*")

	router.Static("/frontend/static", "/workspaces/gesture-control/frontend/static")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	router.GET("/PDA", func(c *gin.Context) {
		c.HTML(http.StatusOK, "PDA.html", nil)
	})

	router.GET("/page-b", func(c *gin.Context) {
		c.HTML(http.StatusOK, "page-b.html", nil)
	})

	router.GET("/tracker", func(c *gin.Context) {
		c.HTML(http.StatusOK, "tracker.html", nil)
	})

	if err := router.Run(":8000"); err != nil {
		panic(err)
	}
}