/**
 * UI component for managing enhancement parameters
 */
export class EnhancementControls {
  constructor(enhancementParams) {
    this.enhancementParams = enhancementParams;
    this.parameters = ['verbosity', 'formality', 'tone', 'complexity', 'persuasiveness'];
    this.sliders = {};
  }

  /**
   * Initialize the controls
   */
  async initialize() {
    // Set up sliders
    this.parameters.forEach(param => {
      const slider = document.getElementById(param);
      if (!slider) {
        console.error(`Slider element not found: ${param}`);
        return;
      }
      
      this.sliders[param] = slider;

      // Add event listeners
      slider.addEventListener('input', async () => {
        const value = parseInt(slider.value);
        if (isNaN(value)) return;

        // Clamp value between 0 and 100
        const clampedValue = Math.min(100, Math.max(0, value));

        // Disable slider while saving
        slider.disabled = true;

        try {
          // Update parameter
          const setterName = `set${param.charAt(0).toUpperCase() + param.slice(1)}`;
          await this.enhancementParams[setterName](clampedValue);
        } catch (error) {
          console.error(`Failed to update ${param}:`, error);
        } finally {
          // Re-enable slider
          slider.disabled = false;
        }
      });
    });

    // Load saved values
    await this._loadSavedValues();
  }

  /**
   * Load saved values from EnhancementParams
   */
  async _loadSavedValues() {
    try {
      // Get current values from enhancementParams
      const params = {};
      this.parameters.forEach(param => {
        params[param] = this.enhancementParams[param];
      });
      
      // Update sliders
      this.parameters.forEach(param => {
        const slider = this.sliders[param];
        if (!slider) return;

        const value = params[param];
        if (value !== undefined) {
          slider.value = value.toString();
        }
      });
    } catch (error) {
      console.error('Failed to load saved values:', error);
    }
  }
} 