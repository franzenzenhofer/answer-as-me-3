/**
 * Document module for Answer As Me 3
 */
namespace Document {
  /**
   * Get or create prompt document
   */
  export function getOrCreatePromptDoc(): GoogleAppsScript.Document.Document {
    const docId = Utils.getProperty(Config.PROPS.PROMPT_DOC_ID);
    
    if (docId) {
      try {
        return DocumentApp.openById(docId);
      } catch (e) {
        // Document doesn't exist or no access
      }
    }
    
    // Create new document
    const doc = DocumentApp.create('Answer As Me 3 – Prompt');
    Utils.setProperty(Config.PROPS.PROMPT_DOC_ID, doc.getId());
    
    // Set default content
    const body = doc.getBody();
    body.setText(Template.getDefaultPromptTemplate());
    
    return doc;
  }
  
  /**
   * Read prompt document text
   */
  export function readPromptText(): string {
    const docId = Validation.ensurePromptDoc();
    const doc = DocumentApp.openById(docId);
    return doc.getBody().getText();
  }
  
  /**
   * Get prompt document URL
   */
  export function getPromptDocUrl(): string {
    const doc = getOrCreatePromptDoc();
    return doc.getUrl();
  }
  
  /**
   * Check if prompt document exists
   */
  export function promptDocExists(): boolean {
    const docId = Utils.getProperty(Config.PROPS.PROMPT_DOC_ID);
    if (!docId) return false;
    
    try {
      DocumentApp.openById(docId);
      return true;
    } catch (e) {
      return false;
    }
  }
}