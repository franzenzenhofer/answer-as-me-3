/**
 * Google Apps Script API Compatibility Layer
 * Handles API version mismatches and provides runtime feature detection
 */

export class GASApiCompatibility {
  private static apiVersionCache = new Map<string, boolean>();

  /**
   * Check if a specific CardService API exists
   */
  static hasCardServiceApi(apiName: string): boolean {
    if (this.apiVersionCache.has(apiName)) {
      return this.apiVersionCache.get(apiName)!;
    }

    try {
      const hasApi = apiName in CardService;
      this.apiVersionCache.set(apiName, hasApi);
      return hasApi;
    } catch {
      this.apiVersionCache.set(apiName, false);
      return false;
    }
  }

  /**
   * Create a Gmail draft response with version compatibility
   */
  static createGmailDraftResponse(draft: GoogleAppsScript.Gmail.GmailDraft): any {
    // Check for newer API
    if (this.hasCardServiceApi('newGmailDraftActionResponse')) {
      try {
        return CardService.newGmailDraftActionResponse()
          .setDraftMetadata(draft.getId());
      } catch (e) {
        console.warn('GmailDraftActionResponse failed, falling back:', e);
      }
    }

    // Fallback to UpdateDraftActionResponse
    if (this.hasCardServiceApi('newUpdateDraftActionResponse')) {
      return CardService.newUpdateDraftActionResponse()
        .setPrintPreviewUrl('https://mail.google.com/mail/u/0/#drafts?compose=' + draft.getId());
    }

    // Last resort: generic action response
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Draft created successfully'))
      .build();
  }

  /**
   * Get available Gmail APIs for the current runtime
   */
  static getAvailableGmailApis(): string[] {
    const apis = [
      'newGmailDraftActionResponse',
      'newUpdateDraftActionResponse',
      'newComposeActionResponseBuilder',
      'newUniversalActionResponseBuilder'
    ];

    return apis.filter(api => this.hasCardServiceApi(api));
  }

  /**
   * Create a type guard for API availability
   */
  static createApiGuard<T>(
    apiName: string,
    factory: () => T,
    fallback: () => T
  ): T {
    if (this.hasCardServiceApi(apiName)) {
      try {
        return factory();
      } catch (e) {
        console.warn(`API ${apiName} exists but failed:`, e);
      }
    }
    return fallback();
  }

  /**
   * Version detection for different GAS services
   */
  static detectServiceVersions(): ServiceVersionInfo {
    const versions: ServiceVersionInfo = {
      cardService: this.detectCardServiceVersion(),
      gmailApp: this.detectGmailAppVersion(),
      driveApp: this.detectDriveAppVersion(),
      runtime: this.detectRuntimeVersion()
    };

    return versions;
  }

  private static detectCardServiceVersion(): string {
    // Check for specific APIs to determine version
    if (this.hasCardServiceApi('newGmailDraftActionResponse')) {
      return 'v2+';
    } else if (this.hasCardServiceApi('newUpdateDraftActionResponse')) {
      return 'v1.1';
    } else {
      return 'v1';
    }
  }

  private static detectGmailAppVersion(): string {
    try {
      // Check for newer methods
      if ('createLabel' in GmailApp) {
        return 'v2+';
      }
      return 'v1';
    } catch {
      return 'unknown';
    }
  }

  private static detectDriveAppVersion(): string {
    try {
      // Check for newer methods
      if ('getStorageLimit' in DriveApp) {
        return 'v2+';
      }
      return 'v1';
    } catch {
      return 'unknown';
    }
  }

  private static detectRuntimeVersion(): string {
    try {
      // Check for V8 runtime features
      if (typeof BigInt !== 'undefined') {
        return 'V8';
      }
      return 'Rhino';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate compatibility report
   */
  static generateCompatibilityReport(): string {
    const versions = this.detectServiceVersions();
    const availableApis = this.getAvailableGmailApis();

    const report = [
      '# Google Apps Script API Compatibility Report',
      '',
      '## Service Versions',
      `- CardService: ${versions.cardService}`,
      `- GmailApp: ${versions.gmailApp}`,
      `- DriveApp: ${versions.driveApp}`,
      `- Runtime: ${versions.runtime}`,
      '',
      '## Available Gmail Card APIs',
      ...availableApis.map(api => `- ${api}`),
      '',
      '## Recommendations',
      this.getRecommendations(versions, availableApis)
    ];

    return report.join('\n');
  }

  private static getRecommendations(
    versions: ServiceVersionInfo,
    availableApis: string[]
  ): string {
    const recommendations: string[] = [];

    if (!availableApis.includes('newGmailDraftActionResponse')) {
      recommendations.push(
        '- Consider using UpdateDraftActionResponse for draft creation'
      );
    }

    if (versions.runtime !== 'V8') {
      recommendations.push(
        '- Enable V8 runtime for better performance and modern JavaScript features'
      );
    }

    return recommendations.length > 0 
      ? recommendations.join('\n')
      : '- All APIs are up to date';
  }
}

interface ServiceVersionInfo {
  cardService: string;
  gmailApp: string;
  driveApp: string;
  runtime: string;
}

// Export wrapper functions for common operations
export const createDraftResponse = (draft: GoogleAppsScript.Gmail.GmailDraft) => 
  GASApiCompatibility.createGmailDraftResponse(draft);

export const hasApi = (apiName: string) => 
  GASApiCompatibility.hasCardServiceApi(apiName);

export const detectVersions = () => 
  GASApiCompatibility.detectServiceVersions();