/**
 * auth.js — Authentication Module
 * Handles player sign up, login, logout, and session management.
 */

const Auth = (() => {
  function init() {
    setupAuthTabs();
    setupLoginForm();
    setupSignupForm();
    populateSignupDropdowns();
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
      App.updateSessionUI();
      App.showToast(`Welcome back, ${player.username}!`, 'success');
      Profile.render();
      form.reset();
    });
  }

  // ─── Sign Up ───
  function setupSignupForm() {
    const form = document.getElementById('signupForm');
    const sportSelect = document.getElementById('signupSport');

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
      const gender = document.getElementById('signupGender').value;
      const sport = document.getElementById('signupSport').value;

      // Validate
      if (!username || !password || !gradeLevel || !gender || !sport) {
        errorEl.textContent = 'Please fill in all required fields.';
        return;
      }

      if (password.length < 4) {
        errorEl.textContent = 'Password must be at least 4 characters.';
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
        gender,
        sports: [{ sport, categories: selectedCats }],
      });

      errorEl.textContent = '';
      Storage.login(player.id);
      App.updateSessionUI();
      App.showToast(`Account created! Your Player ID is ${player.id}`, 'success');
      Profile.render();
      form.reset();
      document.getElementById('signupCategoriesGroup').style.display = 'none';

      // Reset checkbox UI
      document.querySelectorAll('#signupCategories .checkbox-item').forEach(el => {
        el.classList.remove('checked');
      });
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

  // ─── Logout ───
  function logout() {
    Storage.logout();
    App.updateSessionUI();
    App.showToast('Logged out successfully.', 'info');
    Profile.render();
  }

  return {
    init,
    logout,
    refreshSportDropdown,
  };
})();
