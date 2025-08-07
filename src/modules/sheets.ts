/**
 * Sheets module for Answer As Me 3
 */
namespace SheetsUtils {
  // In-memory cache for today's sheet
  let todaySheetCache: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;
  
  /**
   * Get or create today's log sheet with concurrency protection
   */
  export function getTodaySheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    // Return cached sheet if available
    if (todaySheetCache) {
      return todaySheetCache;
    }
    const today = Utils.formatDate(new Date());
    const cachedDate = Utils.getProperty(Config.PROPS.TODAY_DATE);
    const cachedId = Utils.getProperty(Config.PROPS.TODAY_SHEET_ID);
    
    // Use cached sheet if it's still today
    if (cachedDate === today && cachedId) {
      try {
        const sheet = SpreadsheetApp.openById(cachedId);
        todaySheetCache = sheet;
        return sheet;
      } catch (e) {
        // Cached sheet no longer exists
      }
    }
    
    // Acquire lock to prevent duplicate sheet creation
    const lock = LockService.getDocumentLock();
    try {
      // Try to acquire lock for 5 seconds
      lock.waitLock(5000);
    } catch (e) {
      AppLogger.warn('Could not acquire lock for sheet creation', { error: e });
      // Continue anyway - better to risk duplicate than to fail
    }
    
    try {
      // Re-check for existing sheet after acquiring lock
      const sheetName = Config.LOGS.SHEET_PREFIX + today;
      const folder = DriveUtils.getLogsFolder();
      const existingFile = DriveUtils.getFileByNameInFolder(folder, sheetName);
      
      let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
      
      if (existingFile) {
        spreadsheet = SpreadsheetApp.open(existingFile);
    } else {
      // Create new sheet
      spreadsheet = SpreadsheetApp.create(sheetName);
      const file = DriveApp.getFileById(spreadsheet.getId());
      folder.addFile(file);
      
      // Set up headers
      const sheet = spreadsheet.getActiveSheet();
      const headers = [...Config.LOGS.HEADERS];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f3f3');
    }
    
    // Cache the sheet
    Utils.setProperty(Config.PROPS.TODAY_SHEET_ID, spreadsheet.getId());
    Utils.setProperty(Config.PROPS.TODAY_DATE, today);
    
    // Set in-memory cache
    todaySheetCache = spreadsheet;
    
    return spreadsheet;
    } finally {
      // Always release the lock
      try {
        lock.releaseLock();
      } catch (e) {
        // Ignore lock release errors
      }
    }
  }
  
  /**
   * Write log entry to sheet
   */
  export function writeLogEntry(entry: Types.LogEntry): void {
    try {
      const spreadsheet = getTodaySheet();
      const sheet = spreadsheet.getActiveSheet();
      
      // Cap long strings to prevent cell overflow (Sheets limit is ~50k)
      const capString = (value: string | undefined): string => {
        return Utils.capString(value, 49000);
      };
      
      // Build row data
      const row = [
        Utils.formatTimestamp(new Date()),
        entry.Action || '',
        entry.Mode || '',
        entry.Tone || '',
        entry.Intent || '',
        entry.Subject || '',
        (entry.To || []).join(', '),
        (entry.Cc || []).join(', '),
        entry.Success === true ? true : (entry.Success === false ? false : ''),
        entry.Error || '',
        entry.DurationMs || '',
        entry.PromptChars || '',
        entry.Truncated || '',
        entry.RespBytes || '',
        entry.ThreadId || '',
        entry.MessageId || '',
        entry.Notes || '',
        capString(entry.RequestBody),
        capString(entry.ResponseBody),
        entry.ReqFileUrl || '',
        entry.RespFileUrl || ''
      ];
      
      sheet.appendRow(row);
    } catch (e) {
      // Logging should not break the main flow
    }
  }
  
  /**
   * Get today's sheet URL
   */
  export function getTodaySheetUrl(): string {
    const spreadsheet = getTodaySheet();
    return spreadsheet.getUrl();
  }
  
  /**
   * Format log entry for sheet
   */
  export function formatLogEntry(
    action: string,
    data: Partial<Types.LogEntry>
  ): Types.LogEntry {
    return {
      Action: action,
      ...data
    };
  }
}