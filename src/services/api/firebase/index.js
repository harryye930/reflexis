import { AuthService } from './authService.js';
import { DocumentService } from './documentService.js';
import { CodeService } from './codeService.js';
import { CodeHistoryService } from './codeHistoryService.js';
import { HighlightService } from './highlightService.js';
import { UserService } from './userService.js';
import { ConceptualDriftService } from './conceptualDriftService.js';

export class FirebaseServiceFactory {
  constructor(appId) {
    this.appId = appId;
    this._authService = null;
    this._documentService = null;
    this._codeService = null;
    this._codeHistoryService = null;
    this._highlightService = null;
    this._userService = null;
    this._conceptualDriftService = null;
  }

  get auth() {
    if (!this._authService) {
      this._authService = new AuthService(this.appId);
    }
    return this._authService;
  }

  get documents() {
    if (!this._documentService) {
      this._documentService = new DocumentService(this.appId);
    }
    return this._documentService;
  }

  get codes() {
    if (!this._codeService) {
      this._codeService = new CodeService(this.appId);
    }
    return this._codeService;
  }

  get codeHistory() {
    if (!this._codeHistoryService) {
      this._codeHistoryService = new CodeHistoryService(this.appId);
    }
    return this._codeHistoryService;
  }

  // Convenience passthroughs for code history across all codes
  onAllHistorySnapshot(callback) {
    return this.codeHistory.onAllHistorySnapshot(callback);
  }

  async getAllHistory() {
    return this.codeHistory.getAllHistory();
  }

  get highlights() {
    if (!this._highlightService) {
      this._highlightService = new HighlightService(this.appId);
    }
    return this._highlightService;
  }

  get users() {
    if (!this._userService) {
      this._userService = new UserService(this.appId);
    }
    return this._userService;
  }

  get conceptualDrift() {
    if (!this._conceptualDriftService) {
      this._conceptualDriftService = new ConceptualDriftService(this.appId);
    }
    return this._conceptualDriftService;
  }
}

// Export individual services for direct use if needed
export { AuthService } from './authService.js';
export { DocumentService } from './documentService.js';
export { CodeService } from './codeService.js';
export { CodeHistoryService } from './codeHistoryService.js';
export { HighlightService } from './highlightService.js';
export { UserService } from './userService.js';
export { ConceptualDriftService } from './conceptualDriftService.js';