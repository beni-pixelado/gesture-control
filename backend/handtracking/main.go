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

	r := gin.Default()

	_, currentFile, _, _ := runtime.Caller(0)

	mainDir := filepath.Dir(currentFile)

	templatesPath := filepath.Join(mainDir, "templates", "*")

	staticPath := filepath.Join(mainDir, "..", "..", "frontend", "static")

	r.LoadHTMLGlob(templatesPath)

	r.Static("/static", staticPath)

	r.Static("/assets", "./neon-login/dist/assets")

	r.GET("/", func(c *gin.Context) {
    c.File("./backend/neon-login/index.html")
})

// fallback (IMPORTANTE)
r.NoRoute(func(c *gin.Context) {
    c.File("./backend/neon-login/dist/index.html")
})

	r.GET("/hub", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	r.GET("/PDA", func(c *gin.Context) {
		c.HTML(http.StatusOK, "PDA.html", nil)
	})

	r.GET("/page-b", func(c *gin.Context) {
		c.HTML(http.StatusOK, "page-b.html", nil)
	})

	r.GET("/tracker", func(c *gin.Context) {
		c.HTML(http.StatusOK, "tracker.html", nil)
	})

	if err := r.Run(":8000"); err != nil {
		panic(err)
	}

}
