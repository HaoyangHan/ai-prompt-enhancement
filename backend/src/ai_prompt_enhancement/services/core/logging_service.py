import sys
from loguru import logger
from typing import Optional
from pathlib import Path

class LoggingService:
    def __init__(self, log_path: Optional[str] = None):
        """Initialize logging service with optional custom log path."""
        # Remove default handler
        logger.remove()
        
        # Set default log path if not provided
        if not log_path:
            log_path = "logs"
        
        # Create logs directory if it doesn't exist
        Path(log_path).mkdir(exist_ok=True)
        
        # Add console handler with colored output
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="DEBUG"
        )
        
        # Add file handler for all logs
        logger.add(
            f"{log_path}/app.log",
            rotation="500 MB",
            retention="10 days",
            level="DEBUG",
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}"
        )
        
        # Add file handler for errors only
        logger.add(
            f"{log_path}/error.log",
            rotation="100 MB",
            retention="30 days",
            level="ERROR",
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}"
        )

    def get_logger(self):
        """Get the configured logger instance."""
        return logger 