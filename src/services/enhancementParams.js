/**
 * Manages enhancement parameters for text enhancement
 */
export class EnhancementParams {
  constructor() {
    this._verbosity = 50;
    this._formality = 50;
    this._tone = 50;
    this._creativity = 50;
    this._persuasiveness = 50;
    this._changeListeners = new Set();
  }

  /**
   * Initialize parameters from storage
   */
  async initialize() {
    try {
      const { enhancementParams } = await chrome.storage.sync.get('enhancementParams');
      if (enhancementParams) {
        this.setVerbosity(enhancementParams.verbosity);
        this.setFormality(enhancementParams.formality);
        this.setTone(enhancementParams.tone);
        this.setCreativity(enhancementParams.creativity);
        this.setPersuasiveness(enhancementParams.persuasiveness);
      }
    } catch (error) {
      console.error('Failed to load enhancement parameters:', error);
      // Keep default values
    }
  }

  /**
   * Validate and clamp a value to the valid range
   * @param {number} value - The value to validate
   * @returns {number} - The clamped value
   */
  _validateValue(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 50;
    }
    return Math.max(0, Math.min(100, value));
  }

  /**
   * Save current parameters to storage
   */
  async _saveToStorage() {
    try {
      await chrome.storage.sync.set({
        enhancementParams: {
          verbosity: this._verbosity,
          formality: this._formality,
          tone: this._tone,
          creativity: this._creativity,
          persuasiveness: this._persuasiveness
        }
      });
    } catch (error) {
      console.error('Failed to save enhancement parameters:', error);
    }
  }

  /**
   * Notify listeners of parameter changes
   * @param {string} parameter - The parameter that changed
   * @param {number} value - The new value
   */
  _notifyChange(parameter, value) {
    const normalized = value / 100;
    this._changeListeners.forEach(listener => {
      listener({
        parameter,
        value,
        normalized
      });
    });
  }

  // Getters
  get verbosity() { return this._verbosity; }
  get formality() { return this._formality; }
  get tone() { return this._tone; }
  get creativity() { return this._creativity; }
  get persuasiveness() { return this._persuasiveness; }

  // Setters
  setVerbosity(value) {
    this._verbosity = this._validateValue(value);
    this._saveToStorage();
    this._notifyChange('verbosity', this._verbosity);
  }

  setFormality(value) {
    this._formality = this._validateValue(value);
    this._saveToStorage();
    this._notifyChange('formality', this._formality);
  }

  setTone(value) {
    this._tone = this._validateValue(value);
    this._saveToStorage();
    this._notifyChange('tone', this._tone);
  }

  setCreativity(value) {
    this._creativity = this._validateValue(value);
    this._saveToStorage();
    this._notifyChange('creativity', this._creativity);
  }

  setPersuasiveness(value) {
    this._persuasiveness = this._validateValue(value);
    this._saveToStorage();
    this._notifyChange('persuasiveness', this._persuasiveness);
  }

  /**
   * Get all parameters for API prompt
   */
  getPromptParameters() {
    return {
      verbosity: this._verbosity,
      formality: this._formality,
      tone: this._tone,
      creativity: this._creativity,
      persuasiveness: this._persuasiveness
    };
  }

  /**
   * Get normalized parameters (0-1 range)
   */
  getNormalizedParameters() {
    return {
      verbosity: this._verbosity / 100,
      formality: this._formality / 100,
      tone: this._tone / 100,
      creativity: this._creativity / 100,
      persuasiveness: this._persuasiveness / 100
    };
  }

  /**
   * Add a change listener
   * @param {Function} listener - The listener function
   */
  onChange(listener) {
    this._changeListeners.add(listener);
  }

  /**
   * Remove a change listener
   * @param {Function} listener - The listener function to remove
   */
  offChange(listener) {
    this._changeListeners.delete(listener);
  }
} 