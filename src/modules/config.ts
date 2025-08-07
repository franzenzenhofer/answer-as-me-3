/**
 * Configuration module for Answer As Me 3
 */
namespace Config {
  export const APP_NAME = 'Answer As Me 3';
  export const VERSION = '__VERSION__'; // Will be replaced during build
  export const DEPLOY_TIME = '__DEPLOY_TIME__'; // Will be replaced during build
  
  export const SETTINGS = {
    DEFAULT_GREETING: 'Hello World',
    MAX_RETRIES: 3,
    TIMEOUT_MS: 5000
  };
  
  export const COLORS = {
    PRIMARY: '#4285F4',
    SUCCESS: '#34A853',
    WARNING: '#FBBC05',
    ERROR: '#EA4335'
  };
}