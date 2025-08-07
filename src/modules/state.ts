/**
 * State management module with proper encapsulation
 */
namespace State {
  interface AppState {
    userName?: string;
    lastGreeting?: string;
    greetingCount: number;
    lastError?: string;
    apiKey?: string;
  }
  
  // Private state
  let currentState: AppState = {
    greetingCount: 0
  };
  
  // State getters
  export function getUserName(): string | undefined {
    return currentState.userName;
  }
  
  export function getGreetingCount(): number {
    return currentState.greetingCount;
  }
  
  export function getLastGreeting(): string | undefined {
    return currentState.lastGreeting;
  }
  
  export function getApiKey(): string | undefined {
    return currentState.apiKey;
  }
  
  // State setters with validation
  export function setUserName(name: string): void {
    if (name && name.trim().length > 0) {
      currentState.userName = name.trim();
      saveToProperties();
    }
  }
  
  export function incrementGreetingCount(): void {
    currentState.greetingCount++;
    saveToProperties();
  }
  
  export function setLastGreeting(greeting: string): void {
    currentState.lastGreeting = greeting;
    currentState.lastError = undefined; // Clear error on success
    saveToProperties();
  }
  
  export function setLastError(error: string): void {
    currentState.lastError = error;
    Logger.error('State error recorded', error);
  }
  
  export function setApiKey(key: string): void {
    currentState.apiKey = key;
    saveToProperties();
  }
  
  // Persistence methods
  export function loadFromProperties(): void {
    try {
      const userProperties = PropertiesService.getUserProperties();
      const stored = userProperties.getProperty('appState');
      
      if (stored) {
        const parsed = JSON.parse(stored);
        currentState = { ...currentState, ...parsed };
        Logger.info('State loaded from properties', currentState);
      }
    } catch (error) {
      Logger.error('Failed to load state from properties', error);
    }
  }
  
  function saveToProperties(): void {
    try {
      const userProperties = PropertiesService.getUserProperties();
      userProperties.setProperty('appState', JSON.stringify(currentState));
      Logger.debug('State saved to properties');
    } catch (error) {
      Logger.error('Failed to save state to properties', error);
    }
  }
  
  export function reset(): void {
    currentState = { greetingCount: 0 };
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('appState');
    Logger.info('State reset');
  }
}