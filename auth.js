/* Shared demo authentication for Habesha Exam Center.
   Uses the same hec_users and hec_current_user keys as existing pages.
   Browser-only demo authentication is not suitable for production. */
(function () {
  'use strict';
  const USERS_KEY = 'hec_users';
  const CURRENT_USER_KEY = 'hec_current_user';
  function readUsers() {
    let raw;
    try { raw = localStorage.getItem(USERS_KEY); }
    catch (e) { throw new Error('Browser storage is unavailable. Open the site through a local web server and allow site storage.'); }
    if (!raw) return [];
    let users;
    try { users = JSON.parse(raw); }
    catch (e) { throw new Error('Saved account data is damaged. Export or clear the demo account data, then register again.'); }
    if (!Array.isArray(users)) throw new Error('Saved account data has an unexpected format.');
    return users;
  }
  function writeUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); return true; }
    catch (e) { throw new Error('Could not save your account. Check browser storage and available space.'); }
  }
  function register(data) {
    const users = readUsers();
    const email = String(data.email || '').trim().toLowerCase();
    if (users.some(u => u && String(u.email || '').trim().toLowerCase() === email)) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }
    const user = {
      id: 'hec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
      fullName: String(data.fullName || '').trim(), email,
      grade: String(data.grade || ''), password: String(data.password || ''),
      createdAt: new Date().toISOString(), region: '', stream: '',
      examHistory: [], studyPlan: [], preferences: { theme: 'light' }
    };
    users.push(user);
    writeUsers(users);
    try { localStorage.setItem(CURRENT_USER_KEY, user.id); }
    catch (e) { throw new Error('Account saved, but the session could not be started. Please log in.'); }
    return user;
  }
  function login(emailValue, password) {
    const email = String(emailValue || '').trim().toLowerCase();
    const user = readUsers().find(u => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === email && String(u.password ?? '') === String(password ?? ''));
    if (!user) throw new Error('We could not find a matching account. Check your details or register first.');
    if (!user.id) throw new Error('This saved account is incomplete. Please register again.');
    try { localStorage.setItem(CURRENT_USER_KEY, user.id); }
    catch (e) { throw new Error('Your details matched, but browser storage could not start a session.'); }
    return user;
  }
  function currentUser() {
    let id;
    try { id = localStorage.getItem(CURRENT_USER_KEY); } catch (e) { return null; }
    return id ? readUsers().find(u => u && u.id === id) || null : null;
  }
  function logout() { try { localStorage.removeItem(CURRENT_USER_KEY); return true; } catch (e) { return false; } }
  window.HECAuth = Object.freeze({ readUsers, register, login, currentUser, logout });
})();
