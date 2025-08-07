/**
 * Drive module for Answer As Me 3
 */
namespace Drive {
  /**
   * Get or create logs folder
   */
  export function getOrCreateLogsFolder(): GoogleAppsScript.Drive.Folder {
    const folderId = Utils.getProperty(Config.PROPS.LOGS_FOLDER_ID);
    
    if (folderId) {
      try {
        return DriveApp.getFolderById(folderId);
      } catch (e) {
        // Folder doesn't exist or no access
      }
    }
    
    // Create new folder
    const folder = DriveApp.createFolder(Config.LOGS.FOLDER_NAME);
    Utils.setProperty(Config.PROPS.LOGS_FOLDER_ID, folder.getId());
    
    return folder;
  }
  
  /**
   * Get logs folder
   */
  export function getLogsFolder(): GoogleAppsScript.Drive.Folder {
    const folderId = Validation.ensureLogsFolder();
    return DriveApp.getFolderById(folderId);
  }
  
  /**
   * Create JSON file in logs folder
   */
  export function createJsonFile(prefix: string, data: any): string {
    try {
      const timestamp = Date.now();
      const filename = `${prefix}-${timestamp}.json`;
      const content = Utils.jsonStringify(data);
      
      const blob = Utilities.newBlob(content, 'application/json', filename);
      const folder = getLogsFolder();
      const file = folder.createFile(blob);
      
      return file.getUrl();
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Get logs folder URL
   */
  export function getLogsFolderUrl(): string {
    const folder = getOrCreateLogsFolder();
    return folder.getUrl();
  }
  
  /**
   * Check if logs folder exists
   */
  export function logsFolderExists(): boolean {
    const folderId = Utils.getProperty(Config.PROPS.LOGS_FOLDER_ID);
    if (!folderId) return false;
    
    try {
      DriveApp.getFolderById(folderId);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Get file by name in folder
   */
  export function getFileByNameInFolder(folder: GoogleAppsScript.Drive.Folder, name: string): GoogleAppsScript.Drive.File | null {
    const files = folder.getFilesByName(name);
    if (files.hasNext()) {
      return files.next();
    }
    return null;
  }
}