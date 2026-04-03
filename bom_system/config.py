import os

from dotenv import load_dotenv

# Load .env from project root if present
load_dotenv()

# Basic configuration with environment overrides

# SQLite DSN as fallback
SQLALCHEMY_DATABASE_URI = os.getenv(
    "DATABASE_URL",
    "sqlite:///bom_db.sqlite",
)

SQLALCHEMY_TRACK_MODIFICATIONS = False

# Upload constraints
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))  # 5 MB
ALLOWED_IMAGE_MIME = {
    m.strip()
    for m in os.getenv(
        "ALLOWED_IMAGE_MIME",
        "image/png,image/jpeg,image/jpg",
    ).split(",")
    if m.strip()
}

# Request settings
HTTP_FETCH_TIMEOUT = float(os.getenv("HTTP_FETCH_TIMEOUT", "10.0"))

# Admin token for sensitive operations (optional)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

# Placeholder image settings for missing images
PLACEHOLDER_ENABLED = os.getenv("PLACEHOLDER_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
}
PLACEHOLDER_WIDTH = int(os.getenv("PLACEHOLDER_WIDTH", "240"))
PLACEHOLDER_HEIGHT = int(os.getenv("PLACEHOLDER_HEIGHT", "180"))
PLACEHOLDER_BG = os.getenv("PLACEHOLDER_BG", "#f0f3f9")
PLACEHOLDER_FG = os.getenv("PLACEHOLDER_FG", "#2b4c7e")
PLACEHOLDER_TEXT_FMT = os.getenv("PLACEHOLDER_TEXT_FMT", "{part_number}")

# Template file paths (overridable via environment variables)
PSW_TEMPLATE_PATH = os.getenv(
    "PSW_TEMPLATE_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "PSW_Template.xlsx"),
)
PROCESS_CAPABILITY_TEMPLATE_PATH = os.getenv(
    "PROCESS_CAPABILITY_TEMPLATE_PATH",
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "output",
        "01-初始过程能力分析报告 Y1393847.xls",
    ),
)
