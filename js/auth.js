/**
 * auth.js — Authentication Module
 * Handles player sign up, login, logout, password validation, password visibility toggles, and session management.
 */

const Auth = (() => {
  function init() {
    setupAuthTabs();
    setupLoginForm();
    setupSignupForm();
    populateSignupDropdowns();
  }

  // ─── Password Strength Validation ───
  function validatePassword(pw) {
    const missing = [];
    if (!pw || pw.length < 6) missing.push('at least 6 characters');
    if (!/[A-Z]/.test(pw)) missing.push('an uppercase letter (A-Z)');
    if (!/[a-z]/.test(pw)) missing.push('a lowercase letter (a-z)');
    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) missing.push('a number or special character');
    return missing;
  }

  // ─── Toggle Password Visibility (Eye Icon) ───
  function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input || !btnEl) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const eyeOpen = btnEl.querySelector('.eye-open');
    const eyeClosed = btnEl.querySelector('.eye-closed');

    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPassword ? 'none' : 'block';
      eyeClosed.style.display = isPassword ? 'block' : 'none';
    }
  }

  // ─── Auth Tab Switching ───
  function setupAuthTabs() {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.authTab;
        if (tab === 'login') {
          showLoginTab();
        } else {
          showSignupTab();
        }
      });
    });
  }

  // ─── Login ───
  function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');

      if (!username || !password) {
        if (errorEl) errorEl.textContent = 'Please fill in all fields.';
        return;
      }

      const player = Storage.authenticate(username, password);
      if (!player) {
        if (errorEl) errorEl.textContent = 'Invalid username or password.';
        return;
      }

      if (errorEl) errorEl.textContent = '';
      Storage.login(player.id);
      
      // Locking admin session ensures athlete mode is strictly enforced
      Admin.lock();
      App.updateSessionUI();
      App.switchTab('profile');
      Profile.render();
      Admin.render();
      App.showToast(`Welcome back, ${player.username}!`, 'success');
      form.reset();
    });
  }

  // ─── Sign Up ───
  function setupSignupForm() {
    const form = document.getElementById('signupForm');
    const sportSelect = document.getElementById('signupSport');
    const pwInput = document.getElementById('signupPassword');
    const pwHint = document.getElementById('signupPasswordHint');

    if (!form) return;

    // Real-time password requirement helper
    if (pwInput && pwHint) {
      pwInput.addEventListener('input', () => {
        const val = pwInput.value;
        if (val.length === 0) {
          pwHint.textContent = 'Requires min. 6 chars (upper, lower, number/symbol)';
          pwHint.className = 'field-hint';
          return;
        }
        const missing = validatePassword(val);
        if (missing.length === 0) {
          pwHint.textContent = 'Strong password';
          pwHint.className = 'field-hint valid';
        } else {
          pwHint.textContent = 'Add: ' + missing.join(', ');
          pwHint.className = 'field-hint';
        }
      });
    }

    // Sport change → show categories
    if (sportSelect) {
      sportSelect.addEventListener('change', () => {
        const sport = sportSelect.value;
        const catGroup = document.getElementById('signupCategoriesGroup');
        const catContainer = document.getElementById('signupCategories');

        if (!sport || !catGroup || !catContainer) {
          if (catGroup) catGroup.style.display = 'none';
          return;
        }

        catGroup.style.display = 'block';
        catContainer.innerHTML = '';

        const categories = Storage.getCategoriesForSport(sport);
        categories.forEach(cat => {
          const label = document.createElement('label');
          label.className = 'checkbox-item';
          label.innerHTML = `<input type="checkbox" value="${cat}"> ${cat}`;

          const checkbox = label.querySelector('input');
          checkbox.addEventListener('change', () => {
            label.classList.toggle('checked', checkbox.checked);
          });

          catContainer.appendChild(label);
        });
      });
    }

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('signupError');

      const usernameInput = document.getElementById('signupUsername');
      const passwordInput = document.getElementById('signupPassword');
      const gradeInput = document.getElementById('signupGrade');
      const sectionInput = document.getElementById('signupSection');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const gradeLevel = gradeInput ? gradeInput.value : '';
      const section = sectionInput ? sectionInput.value.trim() : '';
      const sport = sportSelect ? sportSelect.value : '';

      // Validate required fields
      if (!username || !password || !gradeLevel || !sport) {
        if (errorEl) errorEl.textContent = 'Please fill in all required fields.';
        return;
      }

      // Validate password strength
      const passwordIssues = validatePassword(password);
      if (passwordIssues.length > 0) {
        if (errorEl) errorEl.textContent = 'Password must include: ' + passwordIssues.join(', ') + '.';
        return;
      }

      // Check username taken
      if (Storage.getPlayerByUsername(username)) {
        if (errorEl) errorEl.textContent = 'Username is already taken.';
        return;
      }

      // Get selected categories
      const selectedCats = [];
      document.querySelectorAll('#signupCategories input:checked').forEach(cb => {
        selectedCats.push(cb.value);
      });

      if (selectedCats.length === 0) {
        if (errorEl) errorEl.textContent = 'Please select at least one category.';
        return;
      }

      // Create player in storage
      const player = Storage.addPlayer({
        username,
        password,
        gradeLevel,
        section,
        sports: [{ sport, categories: selectedCats }],
      });

      // Clear any errors & reset form fields
      if (errorEl) errorEl.textContent = '';
      form.reset();

      // RESET PASSWORD HINT COMPLETELY so it doesn't persist
      if (pwHint) {
        pwHint.textContent = 'Requires min. 6 chars (upper, lower, number/symbol)';
        pwHint.className = 'field-hint';
      }

      const catGroup = document.getElementById('signupCategoriesGroup');
      if (catGroup) catGroup.style.display = 'none';

      // Reset checkbox items UI
      document.querySelectorAll('#signupCategories .checkbox-item').forEach(el => {
        el.classList.remove('checked');
      });

      // Synchronize all views in background
      Leaderboard.render();
      Cards.render();
      if (typeof Home !== 'undefined' && Home.render) Home.render();
      Admin.render();

      // Directly activate Login tab
      showLoginTab();

      // Pre-fill username and focus password
      const loginUsernameInput = document.getElementById('loginUsername');
      const loginPasswordInput = document.getElementById('loginPassword');
      if (loginUsernameInput) loginUsernameInput.value = username;
      if (loginPasswordInput) {
        loginPasswordInput.value = '';
        setTimeout(() => {
          loginPasswordInput.focus();
        }, 100);
      }

      App.showToast(`Account created for ${player.username}! Player ID: ${player.id}. Please sign in to verify credentials.`, 'success');
    });
  }

  // ─── Populate Dropdowns ───
  function populateSignupDropdowns() {
    // Grade levels
    const gradeSelect = document.getElementById('signupGrade');
    if (gradeSelect) {
      Storage.getGradeLevels().forEach(grade => {
        const opt = document.createElement('option');
        opt.value = grade;
        opt.textContent = grade;
        gradeSelect.appendChild(opt);
      });
    }

    // Sports
    refreshSportDropdown();
  }

  function refreshSportDropdown() {
    const sportSelect = document.getElementById('signupSport');
    if (!sportSelect) return;
    // Clear except placeholder
    while (sportSelect.options.length > 1) sportSelect.remove(1);

    Storage.getSportsConfig().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = s.sport;
      sportSelect.appendChild(opt);
    });
  }

  // ─── Logout (Transitions directly back to Login form) ───
  function logout() {
    Storage.logout();
    Admin.lock();
    App.updateSessionUI();

    // Switch view back to Athlete Login page
    App.switchTab('profile');
    showLoginTab();

    const pwInput = document.getElementById('loginPassword');
    if (pwInput) pwInput.value = '';

    Profile.render();
    Admin.render();
    Cards.render();
    Leaderboard.render();
    if (typeof Home !== 'undefined' && Home.render) Home.render();

    App.showToast('Logged out successfully. Please sign in to continue.', 'info');
  }

  function showSignupTab() {
    document.querySelectorAll('.auth-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.authTab === 'signup');
    });
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) loginForm.classList.remove('active');
    if (signupForm) signupForm.classList.add('active');
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    if (authSection) authSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'none';
  }

  function showLoginTab() {
    document.querySelectorAll('.auth-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.authTab === 'login');
    });
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) loginForm.classList.add('active');
    if (signupForm) signupForm.classList.remove('active');
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    if (authSection) authSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'none';
  }

  return {
    init,
    logout,
    validatePassword,
    togglePasswordVisibility,
    refreshSportDropdown,
    showSignupTab,
    showLoginTab,
  };
})();
