package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/beni-pixelado/gesture-control/internal/database"
	"github.com/beni-pixelado/gesture-control/internal/middleware"
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
	r.Static("/assets", "./backend/neon-login/dist/assets")

	// VITE_NEON_AUTH_URL = https://host/neondb/auth
	// O authClient chama /api/auth/get-session
	// Precisamos mapear: /api/auth/get-session → /neondb/auth/get-session
	neonAuthURL := os.Getenv("VITE_NEON_AUTH_URL")
	if neonAuthURL == "" {
		panic("VITE_NEON_AUTH_URL não definido no .env")
	}

	target, err := url.Parse(neonAuthURL)
	if err != nil {
		panic("URL do Neon Auth inválida: " + err.Error())
	}

	// target.Path = "/neondb/auth"
	// req.URL.Path sem o prefixo /api/auth = "/get-session"
	// resultado final = "/neondb/auth/get-session"
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Director = func(req *http.Request) {
    req.URL.Scheme = target.Scheme
    req.URL.Host = target.Host

    suffix := strings.TrimPrefix(req.URL.Path, "/api/auth")
    req.URL.Path = strings.TrimRight(target.Path, "/") + suffix

    // NÃO altere o Host
    req.Host = target.Host

    req.Header.Del("X-Forwarded-Host")
}

	// Todas as chamadas /api/auth/* são proxiadas para o Neon
	r.Any("/api/auth/*path", func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// SPA handler — serve o index.html do React
	spaHandler := func(c *gin.Context) {
    c.File("./backend/neon-login/dist/index.html")
}

	// Rotas públicas do SPA
	r.GET("/", spaHandler)
	r.GET("/auth/*path", spaHandler)

	// Rotas protegidas — exigem sessão válida no banco Neon
	protected := r.Group("/", middleware.AuthMiddleware())
	{
		protected.GET("/hub", func(c *gin.Context) {
			c.HTML(http.StatusOK, "index.html", nil)
		})

		r.Use(func(c *gin.Context) {
	c.Next()

	if c.Writer.Status() >= 300 && c.Writer.Status() < 400 {
		println(
			"REDIRECT:",
			c.Request.Method,
			c.Request.URL.Path,
			"Location:",
			c.Writer.Header().Get("Location"),
		)
	}
})

		protected.GET("/PDA", func(c *gin.Context) {
			c.HTML(http.StatusOK, "PDA.html", nil)
		})
		protected.GET("/page-b", func(c *gin.Context) {
			c.HTML(http.StatusOK, "page-b.html", nil)
		})
		protected.GET("/tracker", func(c *gin.Context) {
			c.HTML(http.StatusOK, "tracker.html", nil)
		})
	}

	// Fallback para rotas desconhecidas
	r.NoRoute(spaHandler)

	if err := r.Run(":8000"); err != nil {
		panic(err)
	}
}