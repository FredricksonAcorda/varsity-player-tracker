/**
 * auth.js — Authentication Module
 * Handles player sign up, login, logout, password validation, and session management.
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

  // ─── Auth Tab Switching ───
  function setupAuthTabs() {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.authTab;

        // Update buttons
        document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tab === 'login' ? 'loginForm' : 'signupForm').classList.add('active');
      });
    });
  }

  // ─── Login ───
  function setupLoginForm() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');

      if (!username || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        return;
      }

      const player = Storage.authenticate(username, password);
      if (!player) {
        errorEl.textContent = 'Invalid username or password.';
        return;
      }

      errorEl.textContent = '';
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
    sportSelect.addEventListener('change', () => {
      const sport = sportSelect.value;
      const catGroup = document.getElementById('signupCategoriesGroup');
      const catContainer = document.getElementById('signupCategories');

      if (!sport) {
        catGroup.style.display = 'none';
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

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('signupError');

      const username = document.getElementById('signupUsername').value.trim();
      const password = document.getElementById('signupPassword').value;
      const gradeLevel = document.getElementById('signupGrade').value;
      const section = document.getElementById('signupSection').value.trim();
      const sport = document.getElementById('signupSport').value;

      // Validate required fields
      if (!username || !password || !gradeLevel || !sport) {
        errorEl.textContent = 'Please fill in all required fields.';
        return;
      }

      // Validate password strength
      const passwordIssues = validatePassword(password);
      if (passwordIssues.length > 0) {
        errorEl.textContent = 'Password must include: ' + passwordIssues.join(', ') + '.';
        return;
      }

      // Check username taken
      if (Storage.getPlayerByUsername(username)) {
        errorEl.textContent = 'Username is already taken.';
        return;
      }

      // Get selected categories
      const selectedCats = [];
      document.querySelectorAll('#signupCategories input:checked').forEach(cb => {
        selectedCats.push(cb.value);
      });

      if (selectedCats.length === 0) {
        errorEl.textContent = 'Please select at least one category.';
        return;
      }

      // Create player
      const player = Storage.addPlayer({
        username,
        password,
        gradeLevel,
        section,
        sports: [{ sport, categories: selectedCats }],
      });

      errorEl.textContent = '';
      form.reset();
      document.getElementById('signupCategoriesGroup').style.display = 'none';

      // Reset checkbox UI
      document.querySelectorAll('#signupCategories .checkbox-item').forEach(el => {
        el.classList.remove('checked');
      });

      // Synchronize views so the new player card immediately appears in Cards and Leaderboard!
      Leaderboard.render();
      Cards.render();
      if (typeof Home !== 'undefined' && Home.render) Home.render();
      Admin.render();

      // Switch to Login tab and prompt athlete to enter credentials
      showLoginTab();
      const loginUsernameInput = document.getElementById('loginUsername');
      const loginPasswordInput = document.getElementById('loginPassword');
      if (loginUsernameInput) loginUsernameInput.value = username;
      if (loginPasswordInput) {
        loginPasswordInput.value = '';
        loginPasswordInput.focus();
      }

      App.switchTab('profile');
      Profile.render();
      App.showToast(`Account created! Player ID: ${player.id}. Please sign in to verify credentials.`, 'success');
    });
  }

  // ─── Populate Dropdowns ───
  function populateSignupDropdowns() {
    // Grade levels
    const gradeSelect = document.getElementById('signupGrade');
    Storage.getGradeLevels().forEach(grade => {
      const opt = document.createElement('option');
      opt.value = grade;
      opt.textContent = grade;
      gradeSelect.appendChild(opt);
    });

    // Sports
    refreshSportDropdown();
  }

  function refreshSportDropdown() {
    const sportSelect = document.getElementById('signupSport');
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
    refreshSportDropdown,
    showSignupTab,
    showLoginTab,
  };
})();
