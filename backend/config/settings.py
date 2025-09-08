import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("config.env")

class Settings:
    # Database Configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 5432))
    DB_USER = os.getenv("DB_USER", "suan")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME_SOURCE = os.getenv("DB_NAME_SOURCE", "compass_cases_details")
    DB_NAME_TARGET = os.getenv("DB_NAME_TARGET", "compass_analytics_preprocessed")
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "processed_cases")
    
    # Gemini API Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Application Configuration
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Similar Cases Configuration
    SIMILAR_CASES_LIMIT = int(os.getenv("SIMILAR_CASES_LIMIT", "150"))
    SIMILAR_CASES_ANALYSIS_LIMIT = int(os.getenv("SIMILAR_CASES_ANALYSIS_LIMIT", "10"))
    SIMILAR_CASES_API_LIMIT = int(os.getenv("SIMILAR_CASES_API_LIMIT", "200"))
    
    @property
    def source_database_url(self):
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME_SOURCE}"
    
    @property
    def target_database_url(self):
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME_TARGET}"
    
    @property
    def use_supabase(self):
        """Check if Supabase should be used instead of local database"""
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

settings = Settings()