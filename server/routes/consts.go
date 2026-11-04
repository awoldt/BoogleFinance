package routes

// this will keep stupid ass bots from pinging the site with invalid tickers
// and prevent an unnecessary request to FMP
var InvalidTickerExtensions = []string{
	// text/docs
	".txt", ".md", ".rtf", ".doc", ".docx", ".odt", ".pdf", ".log", ".tex",
	// data/config
	".csv", ".tsv", ".json", ".xml", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".env", ".sql", ".db", ".sqlite",
	// spreadsheets/presentations
	".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp",
	// images
	".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff", ".tif", ".heic", ".psd",
	// audio
	".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma",
	// video
	".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mpg", ".mpeg",
	// archives
	".zip", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar", ".iso", ".dmg",
	// executables/binaries
	".exe", ".dll", ".so", ".dylib", ".bin", ".msi", ".apk", ".deb", ".rpm", ".bat", ".sh", ".app", ".jar",
	// web
	".html", ".htm", ".css", ".js", ".ts", ".jsx", ".tsx", ".php", ".asp", ".aspx",
	// code
	".go", ".py", ".rs", ".c", ".cpp", ".h", ".java", ".rb", ".cs", ".swift", ".kt", ".lua", ".pl",
	// misc
	".tmp", ".bak", ".swp", ".lock", ".map", ".ttf", ".otf", ".woff", ".woff2", ".torrent",
}
