package main

import (
	"net/http"
	"path/filepath"
	"runtime"

	"github.com/beni-pixelado/gesture-control/internal/database"
	"github.com/gin-gonic/gin"
)

func main() {

	database.Init()

	router := gin.Default()

	_, currentFile, _, _ := runtime.Caller(0)
	
	mainDir := filepath.Dir(currentFile)

	templatesPath := filepath.Join(mainDir, "templates", "*")

	staticPath := filepath.Join(mainDir, "..", "..", "frontend", "static")

	
	router.LoadHTMLGlob(templatesPath)

	router.Static("/static", staticPath)

	
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