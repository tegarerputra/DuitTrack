// ========================================
// DuitTrack - Simple Onboarding Logic
// Clean, simple, no conflicts
// ========================================

class SimpleOnboarding {
  constructor() {
    this.categories = [];
    this.init();
  }

  init() {
    console.log('🎯 Simple Onboarding initialized');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('🔄 Simple onboarding setup called...');
    
    // Check if we're on onboarding page
    const onboardingPage = document.getElementById('budgetOnboardingPage');
    console.log('📄 Onboarding page found:', !!onboardingPage);
    
    if (onboardingPage) {
      console.log('📄 Onboarding page classes:', onboardingPage.classList.toString());
    }
    
    // Setup regardless of active class, as it might be activated later
    console.log('📝 Setting up simple onboarding components...');
    this.setupSuggestions();
    this.setupAddCategory();
    this.setupFormSubmission();
    
    // Also listen for when onboarding page becomes active
    this.watchForOnboardingActivation();
  }

  watchForOnboardingActivation() {
    // Watch for when onboarding page becomes active
    const observer = new MutationObserver(() => {
      const onboardingPage = document.getElementById('budgetOnboardingPage');
      if (onboardingPage && onboardingPage.classList.contains('active')) {
        console.log('🎯 Onboarding page became active, re-setting up...');
        this.setupSuggestions();
        this.setupAddCategory();
        this.setupFormSubmission();
        observer.disconnect(); // Stop observing once setup
      }
    });
    
    const onboardingPage = document.getElementById('budgetOnboardingPage');
    if (onboardingPage) {
      observer.observe(onboardingPage, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }
  }

  handleSuggestionClick(event, suggestion) {
    // CRITICAL: Prevent event bubbling and form submission
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const button = event.target;
    
    // Prevent double clicks
    if (button.classList.contains('adding') || button.classList.contains('added')) {
      console.log('🚫 Button already processing, ignoring click');
      return;
    }
    
    // Show adding state
    button.classList.add('adding');
    console.log('🎯 Adding category with visual feedback:', suggestion.name);
    
    // Add category after a short delay for better UX
    setTimeout(() => {
      this.addCategory(suggestion);
      
      // Show added state
      button.classList.remove('adding');
      button.classList.add('added');
      
      // IMPORTANT: Ensure Add Category button is always visible after adding from suggestions
      this.ensureAddButtonVisible();
      
      
      // Optional: Remove the button after some time for cleaner UI
      setTimeout(() => {
        button.style.opacity = '0';
        button.style.transform = 'scale(0.8)';
        setTimeout(() => {
          if (button.parentNode) {
            button.parentNode.removeChild(button);
          }
        }, 300);
      }, 2000); // Keep visible for 2 seconds before removing
      
    }, 400); // 400ms delay matches the animation
  }

  setupSuggestions() {
    const suggestionsContainer = document.getElementById('suggestionButtons');
    if (!suggestionsContainer) return;

    // Popular categories based on real user data - Indonesian & playful
    const suggestions = [
      { key: 'makan', emoji: '🍽️', name: 'Makan', desc: 'Makan sehari-hari, groceries, masak-masak' },
      { key: 'bensin', emoji: '⛽', name: 'Bensin', desc: 'BBM, ongkos transport, fuel' },
      { key: 'jajan', emoji: '🍿', name: 'Jajan', desc: 'Cemilan, kopi, minuman, treats' },
      { key: 'buah', emoji: '🍎', name: 'Buah', desc: 'Buah segar, cemilan sehat' },
      { key: 'rumah', emoji: '🏠', name: 'Rumah Tangga', desc: 'Kebutuhan rumah, listrik, air' },
      { key: 'hiburan', emoji: '🎮', name: 'Hiburan', desc: 'Nonton, main game, hobi seru' }
    ];

    // Clear and create suggestion buttons
    suggestionsContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
      const button = document.createElement('button');
      button.type = 'button'; // CRITICAL: Prevent form submission
      button.className = 'simple-suggestion-btn';
      button.innerHTML = `${suggestion.emoji} ${suggestion.name}`;
      button.dataset.categoryKey = suggestion.key;
      button.onclick = (e) => this.handleSuggestionClick(e, suggestion);
      suggestionsContainer.appendChild(button);
    });
  }

  addCategory(categoryData) {
    const newCategory = {
      id: 'cat_' + Date.now(),
      emoji: categoryData.emoji,
      name: categoryData.name,
      description: categoryData.desc,
      budget: categoryData.budget || 0 // Default to 0 instead of empty string
    };

    this.categories.push(newCategory);
    this.renderCategories();
    console.log('➕ Category added:', newCategory.name, 'with budget:', newCategory.budget);
    
    // Just focus on the budget input for the newly added category if it's 0
    // Don't show error immediately - only on form submission
    if (newCategory.budget === 0) {
      setTimeout(() => {
        const budgetInput = document.getElementById(`budget-${newCategory.id}`);
        if (budgetInput) {
          budgetInput.focus();
        }
      }, 100);
    }
  }

  renderCategories() {
    const container = document.getElementById('categoryBudgetsList');
    if (!container) return;

    // Check if add category form is currently visible and preserve it
    const existingForm = container.querySelector('.inline-add-form');
    let preservedForm = null;
    
    if (existingForm) {
      // Clone the form to preserve it completely (with all data and state)
      preservedForm = existingForm.cloneNode(true);
      console.log('💾 Preserving complete form during re-render');
      
      // Re-attach event handlers to the cloned form
      this.attachFormEventHandlers(preservedForm);
    }

    // Clear existing categories only (not the form yet)
    const existingCategories = container.querySelectorAll('.simple-category-item');
    existingCategories.forEach(item => item.remove());

    // Render categories
    this.categories.forEach(category => {
      const categoryElement = this.createCategoryElement(category);
      // Insert before add category button (or form if it exists)
      const addButton = container.querySelector('#addCategoryButton');
      const insertBeforeElement = existingForm || addButton;
      
      if (insertBeforeElement) {
        container.insertBefore(categoryElement, insertBeforeElement);
      } else {
        container.appendChild(categoryElement);
      }
    });

    // If we had a preserved form, replace the old one smoothly
    if (preservedForm && existingForm) {
      console.log('🔄 Smoothly replacing form in new position');
      existingForm.replaceWith(preservedForm);
    }

    this.updateTotal();
  }

  attachFormEventHandlers(formElement) {
    const addButtonContainer = document.getElementById('addCategoryButton');
    
    // Setup form interactions
    this.setupInlineFormHandlers(formElement, addButtonContainer);

    // Setup budget input formatting and validation for inline form
    const inlineBudgetInput = formElement.querySelector('#inlineCategoryBudget');
    const inlineNameInput = formElement.querySelector('#inlineCategoryName');
    
    if (inlineBudgetInput) {
      this.setupBudgetInputFormatting(inlineBudgetInput);
      this.setupFieldValidation(inlineBudgetInput, 'budget');
    }
    
    if (inlineNameInput) {
      this.setupFieldValidation(inlineNameInput, 'categoryName');
    }
    
    console.log('🔗 Form event handlers reattached');
  }

  createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'simple-category-item category-budget-item';
    div.dataset.categoryId = category.id;
    div.innerHTML = `
      <div class="category-info">
        <div class="category-icon">${category.emoji}</div>
        <div class="category-details">
          <div class="category-name">${category.name}</div>
          <div class="category-description">${category.description}</div>
        </div>
      </div>
      <div class="budget-input-group">
        <input type="text" class="glass-input simple-budget-input" 
               placeholder="0" value="${category.budget || ''}" min="0"
               id="budget-${category.id}"
               onchange="window.simpleOnboarding.updateCategoryBudget('${category.id}', this.value)"
               oninput="window.simpleOnboarding.handleBudgetInput('${category.id}', this.value)">
        <span class="currency">Rp</span>
      </div>
      <div class="budget-warning" id="warning-${category.id}" style="display: none; color: #ff4444; font-size: 12px; margin-top: 4px; text-align: right;">
        ⚠️ Max. Rp 999.999.999
      </div>
      <div class="category-actions">
        <button type="button" class="simple-delete-btn" onclick="window.simpleOnboarding.deleteCategory('${category.id}', event)" title="Delete category">&times;</button>
      </div>
    `;

    // Add real-time budget formatting and field validation
    const budgetInput = div.querySelector(`#budget-${category.id}`);
    if (budgetInput) {
      this.setupBudgetInputFormatting(budgetInput);
      this.setupFieldValidation(budgetInput, 'budget');
    }

    return div;
  }

  setupBudgetInputFormatting(input) {
    // Store original value for calculation
    const setRawValue = (value) => {
      const numericValue = value.replace(/[^\d]/g, '');
      input.dataset.rawValue = numericValue;
      return numericValue;
    };

    // Format number with dots as thousand separators (Indonesian format)
    const formatNumber = (num) => {
      if (!num) return '';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Smart cursor position calculation
    const setCursorPosition = (input, position) => {
      setTimeout(() => {
        if (input.setSelectionRange) {
          input.setSelectionRange(position, position);
        }
      }, 0);
    };

    // Show/hide warning based on digit limit
    const toggleWarning = (input, show) => {
      const inputId = input.id;
      let warningElement;
      
      if (inputId.startsWith('budget-')) {
        // Regular category input
        const categoryId = inputId.replace('budget-', '');
        warningElement = document.getElementById(`warning-${categoryId}`);
      } else {
        // Inline form or other inputs - use direct ID
        warningElement = document.getElementById(`warning-${inputId}`);
      }
      
      if (warningElement) {
        warningElement.style.display = show ? 'block' : 'none';
      }
    };

    input.addEventListener('input', (e) => {
      // Get cursor position before formatting
      const cursorPos = e.target.selectionStart;
      const oldValue = e.target.value;
      const oldLength = oldValue.length;
      
      // Get only numbers
      let rawValue = setRawValue(e.target.value);
      
      // Enforce 9-digit limit (999.999.999)
      const numericValue = parseInt(rawValue) || 0;
      const maxLimit = 999999999; // 999.999.999
      
      if (rawValue.length > 9) {
        // Block further input and show warning
        rawValue = rawValue.substring(0, 9);
        input.dataset.rawValue = rawValue;
        toggleWarning(e.target, true);
        
        // Restore cursor to end of allowed input
        setTimeout(() => {
          const formatted = formatNumber(rawValue);
          e.target.value = formatted;
          setCursorPosition(e.target, formatted.length);
        }, 0);
        return;
      }
      
      // Show warning only when reaching exactly 999.999.999
      if (numericValue >= maxLimit) {
        toggleWarning(e.target, true);
      } else {
        toggleWarning(e.target, false);
      }
      
      // Format and display with dots in real-time
      if (rawValue) {
        const formatted = formatNumber(rawValue);
        e.target.value = formatted;
        
        // Calculate new cursor position
        const newLength = formatted.length;
        const lengthDiff = newLength - oldLength;
        const newCursorPos = Math.max(0, cursorPos + lengthDiff);
        
        // Set cursor position to prevent jumping
        setCursorPosition(e.target, newCursorPos);
      } else {
        e.target.value = '';
      }
      
      // Trigger real-time calculation update
      const categoryId = input.id.replace('budget-', '');
      if (categoryId) {
        this.handleBudgetInput(categoryId, rawValue);
      }
    });

    input.addEventListener('blur', (e) => {
      // Already formatted in real-time, just ensure consistency
      const rawValue = e.target.dataset.rawValue;
      if (rawValue) {
        e.target.value = formatNumber(rawValue);
      }
      
      // Don't validate on blur - only validate on form submission
      // Just clear any existing errors when user starts editing
    });

    input.addEventListener('focus', (e) => {
      // Clear any previous errors when user starts editing
      this.clearFieldError(e.target);
      
      // Keep formatted view on focus for better UX
      // Users can still edit normally with real-time formatting
      const rawValue = e.target.dataset.rawValue;
      if (rawValue) {
        e.target.value = formatNumber(rawValue);
      }
    });

    // Initialize formatting for existing values
    if (input.value) {
      const rawValue = setRawValue(input.value);
      if (rawValue) {
        // Check initial limit and show warning if needed
        const numericValue = parseInt(rawValue) || 0;
        const maxLimit = 999999999; // 999.999.999
        if (numericValue >= maxLimit) {
          toggleWarning(input, true);
        }
        input.value = formatNumber(rawValue);
      }
    }
  }

  handleBudgetInput(categoryId, value) {
    // Real-time budget update as user types
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.budget = numericValue;
      this.updateTotal();
      console.log(`💰 Updated ${category.name} budget:`, numericValue.toLocaleString('id-ID'));
    }
  }

  updateCategoryBudget(categoryId, value) {
    // Handle formatted input (with dots)
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.budget = numericValue;
      this.updateTotal();
      console.log(`💰 Updated ${category.name} budget:`, numericValue.toLocaleString('id-ID'));
    }
  }


  deleteCategory(categoryId, event) {
    console.log('🔥 SIMPLE-ONBOARDING DELETE CALLED - NO CONFIRM!', categoryId);
    
    // Prevent event bubbling that might trigger form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    
    // Direct delete without confirmation for smoother UX
    const category = this.categories.find(cat => cat.id === categoryId);
    const categoryName = category ? category.name : 'category';
    
    this.categories = this.categories.filter(cat => cat.id !== categoryId);
    this.renderCategories();
    
    console.log('🗑️ Category deleted instantly:', categoryName);
    
    // Optional: Show brief success feedback
    this.showDeleteSuccess(categoryName);
  }
  
  showDeleteSuccess(categoryName) {
    // Create temporary success message
    const message = document.createElement('div');
    message.className = 'delete-success-message';
    message.textContent = `✅ ${categoryName} deleted`;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2s;
    `;
    
    document.body.appendChild(message);
    
    // Auto remove after animation
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 2500);
  }

  updateTotal() {
    const total = this.categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalElement = document.getElementById('totalAllocated');
    if (totalElement) {
      // Format with dots as thousand separators
      const formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      totalElement.textContent = `Rp ${formattedTotal}`;
      
      // Dynamic font scaling based on total length
      const totalDigits = total.toString().length;
      let fontSize = '28px'; // Default font size
      
      if (totalDigits >= 10) {
        fontSize = '18px'; // Very small for 10+ digits
      } else if (totalDigits >= 9) {
        fontSize = '20px'; // Small for 9 digits
      } else if (totalDigits >= 7) {
        fontSize = '24px'; // Medium for 7-8 digits
      }
      
      totalElement.style.fontSize = fontSize;
      console.log(`🧮 Total budget updated: ${formattedTotal} (${totalDigits} digits, font: ${fontSize})`);
    }
  }

  setupAddCategory() {
    // Fix: Look for the button inside the div with id addCategoryButton
    const addButtonContainer = document.getElementById('addCategoryButton');
    const addButton = addButtonContainer ? addButtonContainer.querySelector('button') : null;
    
    if (!addButton) {
      console.error('❌ Add category button not found!');
      return;
    }

    console.log('✅ Add category button found, setting up click handler...');
    addButton.onclick = (e) => {
      e.preventDefault();
      console.log('🔥 Add category button clicked!');
      this.showAddCategoryForm();
    };
  }

  showAddCategoryForm() {
    const container = document.getElementById('categoryBudgetsList');
    const addButtonContainer = document.getElementById('addCategoryButton');
    
    if (!container || !addButtonContainer) return;
    
    // Check if form already exists
    const existingForm = container.querySelector('.inline-add-form');
    if (existingForm) {
      existingForm.remove();
    }

    // Hide add button
    addButtonContainer.style.display = 'none';

    // Create inline form
    const formElement = document.createElement('div');
    formElement.className = 'inline-add-form';
    formElement.innerHTML = `
      <div class="simple-category-item" style="border: 2px dashed rgba(184, 134, 11, 0.4); background: rgba(184, 134, 11, 0.05);">
        <div class="category-info">
          <div class="category-icon" id="inlineEmojiPreview">💰</div>
          <div class="category-details">
            <input type="text" id="inlineCategoryName" class="glass-input" placeholder="Category name (e.g., Transport, Food)" style="margin-bottom: 8px; font-weight: 500;">
            <input type="text" id="inlineCategoryDesc" class="glass-input" placeholder="Optional description" style="font-size: 14px; opacity: 0.8;">
          </div>
        </div>
        <div class="budget-input-group">
          <input type="text" id="inlineCategoryBudget" class="glass-input simple-budget-input" placeholder="0" min="0">
          <span class="currency">Rp</span>
        </div>
        <div class="budget-warning" id="warning-inlineCategoryBudget" style="display: none; color: #ff4444; font-size: 12px; margin-top: 4px; text-align: right;">
          ⚠️ Max. Rp 999.999.999
        </div>
        <div class="form-actions" style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="cancel-btn" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; cursor: pointer;">Cancel</button>
          <button type="button" class="save-btn" style="padding: 8px 16px; background: rgba(184, 134, 11, 0.8); border: 1px solid rgba(184, 134, 11, 0.5); border-radius: 6px; color: #fff; cursor: pointer; font-weight: 500;">Add Category</button>
        </div>
      </div>
    `;

    // Insert form above add button
    addButtonContainer.parentNode.insertBefore(formElement, addButtonContainer);

    // Setup form interactions
    this.setupInlineFormHandlers(formElement, addButtonContainer);

    // Setup budget input formatting and validation for inline form
    const inlineBudgetInput = formElement.querySelector('#inlineCategoryBudget');
    const inlineNameInput = formElement.querySelector('#inlineCategoryName');
    
    if (inlineBudgetInput) {
      this.setupBudgetInputFormatting(inlineBudgetInput);
      this.setupFieldValidation(inlineBudgetInput, 'budget');
    }
    
    if (inlineNameInput) {
      this.setupFieldValidation(inlineNameInput, 'categoryName');
    }

    // Focus on name input
    const nameInput = formElement.querySelector('#inlineCategoryName');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }

    console.log('✅ Inline add category form shown');
  }

  setupInlineFormHandlers(formElement, addButtonContainer) {
    const nameInput = formElement.querySelector('#inlineCategoryName');
    const descInput = formElement.querySelector('#inlineCategoryDesc');
    const budgetInput = formElement.querySelector('#inlineCategoryBudget');
    const emojiPreview = formElement.querySelector('#inlineEmojiPreview');
    const cancelBtn = formElement.querySelector('.cancel-btn');
    const saveBtn = formElement.querySelector('.save-btn');

    // Auto emoji detection
    if (nameInput && emojiPreview) {
      nameInput.addEventListener('input', () => {
        const emoji = this.detectEmojiFromName(nameInput.value);
        emojiPreview.textContent = emoji;
      });
    }

    // Cancel button
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚫 Cancel clicked - closing form cleanly');
        
        // Clear all form errors immediately (no blur validation to worry about!)
        this.clearFormErrors();
        this.clearAllErrors();
        
        // Close form with smooth animation
        formElement.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
          formElement.remove();
          addButtonContainer.style.display = 'block';
          console.log('✅ Form cancelled successfully');
        }, 300);
      };
    }

    // Save button
    if (saveBtn) {
      saveBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = nameInput.value.trim();
        const desc = descInput.value.trim();
        const budget = parseInt(budgetInput.value.replace(/[^\d]/g, '')) || 0;

        // Validate category name
        if (!this.validateCategoryName(nameInput, name)) {
          nameInput.focus();
          return;
        }

        // Validate budget if entered
        if (budgetInput.value.trim()) {
          if (!this.validateBudgetInput(budgetInput, budgetInput.value, true)) {
            budgetInput.focus();
            return;
          }
        }

        const customCategory = {
          emoji: emojiPreview.textContent || '💰',
          name: name,
          desc: desc || 'Custom category',
          budget: budget // Fix: Include budget from input
        };

        // Show loading state on save button
        saveBtn.classList.add('loading');
        saveBtn.textContent = 'Adding magic...';
        saveBtn.disabled = true;
        
        console.log('💰 Adding custom category with budget:', budget);
        this.addCategory(customCategory);
        
        // Remove form with animation
        formElement.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
          formElement.remove();
          addButtonContainer.style.display = 'block';
        }, 300);

        console.log('✅ Custom category added:', name);
      };
    }

    // Enter key to save
    [nameInput, descInput, budgetInput].forEach(input => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveBtn.click();
          }
        });
      }
    });
  }

  // ========================================
  // FIELD-LEVEL ERROR HANDLING SYSTEM
  // Clean, UX-focused validation with errors directly below fields
  // ========================================
  
  // Create or get error container for a field
  getOrCreateErrorContainer(input) {
    const inputId = input.id;
    let errorContainer = input.parentNode.querySelector('.field-error');
    
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'field-error';
      errorContainer.id = inputId + '-error';
      errorContainer.style.display = 'none';
      
      // Insert directly after the input (or after budget-input-group)
      const budgetGroup = input.closest('.budget-input-group');
      if (budgetGroup) {
        // For budget inputs, insert after the group
        budgetGroup.parentNode.insertBefore(errorContainer, budgetGroup.nextSibling);
      } else {
        // For regular inputs, insert after the input
        input.parentNode.insertBefore(errorContainer, input.nextSibling);
      }
    }
    
    return errorContainer;
  }
  
  // Show field error directly below the input
  showFieldError(input, message) {
    // Add visual error state to input
    input.classList.add('error-state');
    
    // Add error state to budget group if applicable
    const budgetGroup = input.closest('.budget-input-group');
    if (budgetGroup) {
      budgetGroup.classList.add('has-error');
    }
    
    // Get or create error container
    const errorContainer = this.getOrCreateErrorContainer(input);
    
    // Set message and show with animation
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    errorContainer.classList.add('show');
    
    console.log(`❌ Field error shown for ${input.id}:`, message);
  }
  
  // Clear field error
  clearFieldError(input) {
    // Remove visual error state
    input.classList.remove('error-state');
    
    // Remove error state from budget group
    const budgetGroup = input.closest('.budget-input-group');
    if (budgetGroup) {
      budgetGroup.classList.remove('has-error');
    }
    
    // Hide error container
    const inputId = input.id;
    const errorContainer = document.getElementById(inputId + '-error');
    if (errorContainer) {
      errorContainer.style.display = 'none';
      errorContainer.classList.remove('show');
    }
  }
  
  // Clear all field errors
  clearAllFieldErrors() {
    const allErrorContainers = document.querySelectorAll('.field-error');
    allErrorContainers.forEach(container => {
      container.style.display = 'none';
      container.classList.remove('show');
    });
    
    const allErrorInputs = document.querySelectorAll('.error-state');
    allErrorInputs.forEach(input => {
      input.classList.remove('error-state');
    });
    
    const allErrorGroups = document.querySelectorAll('.has-error');
    allErrorGroups.forEach(group => {
      group.classList.remove('has-error');
    });
  }
  
  // Validate budget input with appropriate error handling
  validateBudgetInput(input, value, isSubmitValidation = false) {
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    const isEmpty = !value.trim();
    
    // Clear previous errors for this field
    this.clearFieldError(input);
    
    // Empty validation - only show on submit, not on blur
    if (isEmpty && isSubmitValidation) {
      this.showFieldError(input, "Don't leave me empty! I need a budget!");
      return false;
    }
    
    // Range validations - show on both blur and submit (if not empty)
    if (!isEmpty) {
      if (numericValue < 1000) {
        this.showFieldError(input, "Come on, at least Rp 1,000! Your wallet can do it!");
        return false;
      }
      
      if (numericValue > 999999999) {
        this.showFieldError(input, "Whoa there, millionaire! Max Rp 999,999,999 please!");
        return false;
      }
    }
    
    return true;
  }
  
  // Validate category name input
  validateCategoryName(input, value) {
    this.clearFieldError(input);
    
    if (!value.trim()) {
      this.showFieldError(input, "Don't leave me empty! Category needs a name!");
      return false;
    }
    
    // Check for duplicates
    if (this.categories.some(cat => cat.name.toLowerCase() === value.toLowerCase())) {
      this.showFieldError(input, "Oops! That name's already taken! Try another one");
      return false;
    }
    
    return true;
  }
  
  // Show category form-level errors (below Add Category button/form)
  showFormError(message) {
    console.log('📋 Category form error:', message);
    
    // Find insertion point - after Add Category button or inline form (whichever is visible)
    const addButtonContainer = document.getElementById('addCategoryButton');
    const inlineForm = document.querySelector('.inline-add-form');
    const insertAfter = inlineForm || addButtonContainer;
    
    if (!insertAfter) {
      console.error('❌ Add category button/form not found');
      return;
    }
    
    // Remove existing category form errors
    this.clearFormErrors();
    
    // Create category form error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'category-form-error-container';
    errorContainer.style.cssText = `
      margin-top: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      width: 100%;
    `;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'category-form-error field-error show';
    errorDiv.style.cssText = `
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid var(--danger-color);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      text-align: left;
      color: var(--danger-color);
      font-size: var(--font-size-sm);
      font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    errorContainer.appendChild(errorDiv);
    
    // Insert AFTER the add category button or inline form
    insertAfter.parentNode.insertBefore(errorContainer, insertAfter.nextSibling);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (errorContainer.parentNode) {
        errorContainer.remove();
      }
    }, 8000);
  }
  
  // Show system-level errors (below Complete Setup button)
  showSystemError(message) {
    console.log('🔧 System error:', message);
    
    // Find the onboarding actions container (where Complete Setup button is)
    const actionsContainer = document.querySelector('.onboarding-actions');
    if (!actionsContainer) {
      console.error('❌ Onboarding actions container not found');
      return;
    }
    
    // Remove existing system errors
    this.clearSystemErrors();
    
    // Create system error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'system-error-container';
    errorContainer.style.cssText = `
      margin-top: var(--spacing-md);
      width: 100%;
    `;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'system-error field-error show';
    errorDiv.style.cssText = `
      background: rgba(248, 81, 73, 0.15);
      border: 2px solid var(--danger-color);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      text-align: center;
      color: var(--danger-color);
      font-size: var(--font-size-sm);
      font-weight: 600;
    `;
    errorDiv.textContent = message;
    
    errorContainer.appendChild(errorDiv);
    
    // Insert AFTER the actions container (below Complete Setup button)
    actionsContainer.parentNode.insertBefore(errorContainer, actionsContainer.nextSibling);
    
    // Auto-remove after 12 seconds (longer for critical system errors)
    setTimeout(() => {
      if (errorContainer.parentNode) {
        errorContainer.remove();
      }
    }, 12000);
  }
  
  // Clear category form-level errors only
  clearFormErrors() {
    const formErrors = document.querySelectorAll('.category-form-error-container');
    formErrors.forEach(error => error.remove());
  }
  
  // Clear system-level errors only  
  clearSystemErrors() {
    const systemErrors = document.querySelectorAll('.system-error-container');
    systemErrors.forEach(error => error.remove());
  }
  
  // Clear all errors (field + form + system)
  clearAllErrors() {
    this.clearAllFieldErrors();
    this.clearFormErrors();
    this.clearSystemErrors();
  }
  
  // Set up event listeners for field validation
  setupFieldValidation(input, validationType = 'budget') {
    // Clear error when user starts typing
    input.addEventListener('input', () => {
      this.clearFieldError(input);
    });
    
    // REMOVED: Blur validation for better UX
    // User will only see validation on submit, not when navigating between fields
    console.log('✅ Field validation setup (input only, no blur validation)');
  }

  focusFirstErrorField() {
    // Find first field with error
    const firstErrorField = document.querySelector('.glass-input.error-state');
    if (!firstErrorField) return;

    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Mobile: Gentle scroll + visual highlight (no focus to avoid keyboard)
      firstErrorField.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add temporary highlight effect
      firstErrorField.classList.add('error-focus-highlight');
      
      // Remove highlight after animation
      setTimeout(() => {
        firstErrorField.classList.remove('error-focus-highlight');
      }, 2000);
      
      console.log('📱 Mobile: Scrolled to error field with highlight');
    } else {
      // Desktop: Traditional focus
      firstErrorField.focus();
      
      // Gentle scroll into view as backup
      firstErrorField.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      console.log('🖥️ Desktop: Focused on error field');
    }
  }

  detectEmojiFromName(name) {
    if (!name) return '💰';
    
    const lowercaseName = name.toLowerCase();
    
    // Enhanced category mappings based on user's actual budget data
    const emojiMap = {
      // Food categories - most used in user's data
      'makan': '🍽️', 'food': '🍽️', 'makanan': '🍽️', 'restoran': '🍽️', 'masak': '🍳',
      
      // Transportation & Fuel - high budget item in user data  
      'bensin': '⛽', 'gas': '⛽', 'bbm': '⛽', 'fuel': '⛽', 'isi bensin': '⛽',
      'transport': '🚗', 'transportasi': '🚗', 'ojek': '🏍️', 'grab': '📱',
      
      // Utilities
      'listrik': '⚡', 'electricity': '⚡', 'pln': '⚡',
      
      // Shopping
      'belanja': '🛒', 'shopping': '🛒', 'groceries': '🛒', 'beli': '🛍️',
      
      // Snacks - significant category in user data
      'jajan': '🍿', 'snack': '🍿', 'snacks': '🍿', 'cemilan': '🥨', 'kopi': '☕',
      
      // Fruits - specific category from user spreadsheet
      'buah': '🍎', 'fruit': '🍎', 'semangka': '🍉', 'melon': '🍈', 
      'jeruk': '🍊', 'pisang': '🍌', 'apel': '🍎', 'kelapa': '🥥', 'mangga': '🥭',
      
      // Household - major category in user data
      'rumah': '🏠', 'household': '🏠', 'rumah tangga': '🏠', 'hous': '🏠', 'house': '🏠', 'sewa': '🏠',
      
      // Entertainment
      'hiburan': '🎮', 'entertainment': '🎮', 'cinema': '🎬',
      
      // Health & Education
      'kesehatan': '💊', 'health': '💊', 'dokter': '👨‍⚕️',
      'pendidikan': '🎓', 'education': '🎓', 'sekolah': '🏫',
      
      // Clothing
      'pakaian': '👕', 'clothes': '👕', 'fashion': '👗',
      
      // Family expenses (from user data: Nafkah Farah)
      'nafkah': '👨‍👩‍👧‍👦', 'family': '👨‍👩‍👧‍👦', 'farah': '👩', 'anak': '👶'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowercaseName.includes(key)) {
        return emoji;
      }
    }

    return '💰'; // default
  }

  setupFormSubmission() {
    const form = document.getElementById('budgetOnboardingForm');
    const skipButton = document.getElementById('skipBudgetBtn');

    if (form) {
      // Remove any existing event listeners first
      form.onsubmit = null;
      
      // Add new event listener
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 Simple onboarding form submit triggered');
        this.submitBudget();
      });
    }

    if (skipButton) {
      // Remove any existing event listeners first
      skipButton.onclick = null;
      
      skipButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 Simple onboarding skip triggered');
        this.skipSetup();
      });
    }
  }

  async submitBudget() {
    try {
      console.log('📊 Submitting simple budget with field-level validation...');
      
      // Clear any existing errors
      this.clearAllErrors();
      
      let hasErrors = false;

      if (!window.auth?.currentUser) {
        this.showSystemError("Hold on! You need to sign in first!");
        return;
      }

      // Check if inline add category form is open
      const inlineForm = document.querySelector('.inline-add-form');
      if (inlineForm) {
        const nameInput = inlineForm.querySelector('#inlineCategoryName');
        const budgetInput = inlineForm.querySelector('#inlineCategoryBudget');
        
        const hasName = nameInput && nameInput.value.trim();
        const hasBudget = budgetInput && budgetInput.value.trim();
        
        if (hasName || hasBudget) {
          // Validate fields in open form
          if (nameInput) {
            if (!this.validateCategoryName(nameInput, nameInput.value)) {
              hasErrors = true;
            }
          }
          
          if (budgetInput && budgetInput.value.trim()) {
            if (!this.validateBudgetInput(budgetInput, budgetInput.value, true)) {
              hasErrors = true;
            }
          }
          
          // Show form-level error too
          this.showFormError('Please finish adding your category first!');
          return;
        }
      }
      
      // Check if we have any categories
      if (this.categories.length === 0) {
        this.showFormError('Oops! Add at least one category before completing setup!');
        return;
      }
      
      // Validate all existing category budgets with field-level errors
      for (const category of this.categories) {
        const budgetInput = document.getElementById(`budget-${category.id}`);
        if (budgetInput) {
          if (!this.validateBudgetInput(budgetInput, budgetInput.value || '0', true)) {
            hasErrors = true;
          }
        }
      }
      
      if (hasErrors) {
        // Focus on first error field for better UX
        this.focusFirstErrorField();
        return;
      }

      // Show loading state
      const submitBtn = document.querySelector('#budgetOnboardingForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Saving your awesome budget...';
        submitBtn.disabled = true;
      }

      // Prepare data
      const userId = window.auth.currentUser.uid;
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const budgetData = {
        totalBudget: this.categories.reduce((sum, cat) => sum + cat.budget, 0),
        categories: {},
        month: month,
        createdAt: new Date().toISOString()
      };

      // Convert categories
      this.categories.forEach(category => {
        budgetData.categories[category.name.toLowerCase()] = {
          budget: category.budget,
          spent: 0
        };
      });

      // Save to Firestore
      await window.db.collection('users').doc(userId).collection('budgets').doc(month).set(budgetData);
      
      // Mark onboarding complete
      await window.db.collection('users').doc(userId).set({
        onboardingComplete: true,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('✅ Budget saved successfully!');
      
      // Go to dashboard
      window.location.hash = '#dashboard';
      this.showDashboard();

    } catch (error) {
      console.error('❌ Error saving budget:', error);
      this.showSystemError('Oops! Something went wrong saving your budget: ' + error.message);
      
      // Reset button state
      const submitBtn = document.querySelector('#budgetOnboardingForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Complete Setup';
        submitBtn.disabled = false;
      }
    }
  }

  async skipSetup() {
    try {
      if (!window.auth?.currentUser) {
        this.showSystemError("Hold on! You need to sign in first!");
        return;
      }

      const userId = window.auth.currentUser.uid;
      await window.db.collection('users').doc(userId).set({
        onboardingComplete: true,
        skippedBudgetSetup: true,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('✅ Skipped setup successfully!');
      this.showDashboard();
    } catch (error) {
      console.error('❌ Error skipping setup:', error);
      this.showSystemError('Uh oh! Something went wrong: ' + error.message);
    }
  }

  ensureAddButtonVisible() {
    const addButtonContainer = document.getElementById('addCategoryButton');
    if (addButtonContainer) {
      addButtonContainer.style.display = 'block';
      console.log('✅ Add Category button made visible');
    } else {
      console.error('❌ Add Category button container not found');
    }
  }

  showDashboard() {
    // Hide onboarding page
    const onboardingPage = document.getElementById('budgetOnboardingPage');
    if (onboardingPage) {
      onboardingPage.classList.remove('active');
    }

    // Show dashboard page
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) {
      dashboardPage.classList.add('active');
    }
  }
}

// Initialize
window.simpleOnboarding = new SimpleOnboarding();
console.log('🎯 Simple onboarding module loaded');