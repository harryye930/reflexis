import { AuthService } from './authService.js';
import { DocumentService } from './documentService.js';
import { CodeService } from './codeService.js';
import { HighlightService } from './highlightService.js';
import { NotificationService } from './notificationService.js';
import { UserService } from './userService.js';

export class FirebaseServiceFactory {
  constructor(appId) {
    this.appId = appId;
    this._authService = null;
    this._documentService = null;
    this._codeService = null;
    this._highlightService = null;
    this._notificationService = null;
    this._userService = null;
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

  get highlights() {
    if (!this._highlightService) {
      this._highlightService = new HighlightService(this.appId);
    }
    return this._highlightService;
  }

  get notifications() {
    if (!this._notificationService) {
      this._notificationService = new NotificationService(this.appId);
    }
    return this._notificationService;
  }

  get users() {
    if (!this._userService) {
      this._userService = new UserService(this.appId);
    }
    return this._userService;
  }
}

// Export individual services for direct use if needed
export { AuthService } from './authService.js';
export { DocumentService } from './documentService.js';
export { CodeService } from './codeService.js';
export { HighlightService } from './highlightService.js';
export { NotificationService } from './notificationService.js';
export { UserService } from './userService.js'; 