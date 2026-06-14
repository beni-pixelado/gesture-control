package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/beni-pixelado/gesture-control/backend/internal/database"
	"github.com/beni-pixelado/gesture-control/backend/internal/handlers"
	"github.com/beni-pixelado/gesture-control/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	r := gin.Default()

	r.LoadHTMLGlob("backend/templates/*")
	r.Static("/static", "frontend/static")
	r.Static("/assets", "frontend/auth/dist/assets")

	// --- Proxy reverso para o Neon Auth ---
	neonAuthURL := os.Getenv("VITE_NEON_AUTH_URL")
	if neonAuthURL == "" {
		panic("VITE_NEON_AUTH_URL não definido no .env")
	}

	target, err := url.Parse(neonAuthURL)
	if err != nil {
		panic("URL do Neon Auth inválida: " + err.Error())
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Director = func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host

		suffix := strings.TrimPrefix(req.URL.Path, "/api/auth")
		req.URL.Path = strings.TrimRight(target.Path, "/") + suffix

		req.Host = target.Host
		req.Header.Del("X-Forwarded-Host")
	}

	r.Any("/api/auth/*path", func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// --- SPA React ---
	spaHandler := func(c *gin.Context) {
		c.File("frontend/auth/dist/index.html")
	}

	r.GET("/", spaHandler)
	r.GET("/auth/*path", spaHandler)

	// --- Rotas protegidas ---
	protected := r.Group("/", middleware.AuthMiddleware())
	{
		protected.GET("/hub", func(c *gin.Context) {
			c.HTML(http.StatusOK, "index.html", nil)
		})

		// PDA agora tem handler próprio para buscar as notas do banco
		protected.GET("/PDA", handlers.PDAPage)

		protected.GET("/page-b", func(c *gin.Context) {
			c.HTML(http.StatusOK, "page-b.html", nil)
		})
		protected.GET("/tracker", func(c *gin.Context) {
			c.HTML(http.StatusOK, "tracker.html", nil)
		})

		// Notas
		protected.GET("/notes/new", handlers.NewNoteForm)
		protected.POST("/notes", handlers.CreateNote)
	}

	r.NoRoute(spaHandler)

	if err := r.Run(":8000"); err != nil {
		panic(err)
	}
}