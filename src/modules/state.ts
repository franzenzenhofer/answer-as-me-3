/**
 * State management module for Answer As Me 3
 * Uses PropertiesService for individual property storage
 */
namespace State {
  /**
   * Save settings
   */
  export function saveSettings(settings: {
    apiKey?: string;
    defaultMode?: Types.EmailMode;
    defaultTone?: Types.EmailTone;
  }): void {
    if (settings.apiKey !== undefined) {
      Utils.setProperty(Config.PROPS.API_KEY, settings.apiKey);
    }
    
    if (settings.defaultMode !== undefined) {
      Utils.setProperty(Config.PROPS.DEFAULT_MODE, settings.defaultMode);
    }
    
    if (settings.defaultTone !== undefined) {
      Utils.setProperty(Config.PROPS.DEFAULT_TONE, settings.defaultTone);
    }
  }
  
  /**
   * Get all settings
   */
  export function getSettings(): {
    apiKey: string;
    defaultMode: Types.EmailMode;
    defaultTone: Types.EmailTone;
    hasPromptDoc: boolean;
    hasLogsFolder: boolean;
  } {
    return {
      apiKey: Utils.getProperty(Config.PROPS.API_KEY),
      defaultMode: Validation.validateEmailMode(
        Utils.getProperty(Config.PROPS.DEFAULT_MODE, Config.DEFAULTS.MODE)
      ),
      defaultTone: Validation.validateEmailTone(
        Utils.getProperty(Config.PROPS.DEFAULT_TONE, Config.DEFAULTS.TONE)
      ),
      hasPromptDoc: Document.promptDocExists(),
      hasLogsFolder: DriveUtils.logsFolderExists()
    };
  }
  
  /**
   * Clear all settings (factory reset)
   */
  export function clearAllSettings(): void {
    Utils.getProperties().deleteAllProperties();
  }
  
  /**
   * Check if all requirements are configured
   */
  export function isFullyConfigured(): boolean {
    const settings = getSettings();
    return !!(
      settings.apiKey &&
      settings.hasPromptDoc &&
      settings.hasLogsFolder
    );
  }
  
  /**
   * Get missing requirements
   */
  export function getMissingRequirements(): string[] {
    const missing: string[] = [];
    const settings = getSettings();
    
    if (!settings.apiKey) {
      missing.push('API key');
    }
    
    if (!settings.hasPromptDoc) {
      missing.push('Prompt document');
    }
    
    if (!settings.hasLogsFolder) {
      missing.push('Logs folder');
    }
    
    return missing;
  }
}