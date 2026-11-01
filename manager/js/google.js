/* Google Identity Services — token model, scope drive.file only. */
(function (root) {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  let clientId = '';
  let tokenClient = null;
  let pending = null;
  let current = null;

  function restore() {
    try {
      const token = sessionStorage.getItem('tm.token');
      const exp = Number(sessionStorage.getItem('tm.exp') || 0);
      if (token && exp > Date.now() + 5000) current = { token, exp };
    } catch (e) { /* private mode */ }
  }
  function remember(token, expiresIn) {
    current = { token, exp: Date.now() + (Number(expiresIn) || 3600) * 1000 };
    try {
      sessionStorage.setItem('tm.token', current.token);
      sessionStorage.setItem('tm.exp', String(current.exp));
    } catch (e) { /* ignore */ }
  }
  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('gis'));
      document.head.appendChild(s);
    });
  }
  function client() {
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp) => {
          const wait = pending;
          pending = null;
          if (!wait) return;
          if (!resp || resp.error) wait.reject(new Error((resp && resp.error) || 'auth'));
          else { remember(resp.access_token, resp.expires_in); wait.resolve(resp.access_token); }
        }
      });
    }
    return tokenClient;
  }
  function request(prompt, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending && pending.reject === reject) pending = null;
        reject(new Error('timeout'));
      }, timeoutMs);
      pending = {
        resolve: (token) => { clearTimeout(timer); resolve(token); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      };
      client().requestAccessToken({ prompt: prompt });
    });
  }

  restore();

  root.TMGoogle = {
    SCOPE,
    configured() { return !!clientId; },
    setClientId(id) { clientId = String(id || '').trim(); tokenClient = null; },
    async signIn(selectAccount) {
      await loadGis();
      return request(selectAccount ? 'select_account' : 'consent', 120000);
    },
    async silent() {
      if (!clientId) return null;
      if (current && current.exp > Date.now() + 60000) return current.token;
      try {
        await loadGis();
        return await request('', 15000);
      } catch (e) {
        return null;
      }
    },
    async getToken(force) {
      if (!force && current && current.exp > Date.now() + 60000) return current.token;
      await loadGis();
      try {
        return await request('', force ? 20000 : 15000);
      } catch (e) {
        if (current && !force) return current.token;
        throw e;
      }
    },
    signOut() {
      const token = current && current.token;
      current = null;
      try { sessionStorage.removeItem('tm.token'); sessionStorage.removeItem('tm.exp'); } catch (e) { /* ignore */ }
      if (token && window.google && google.accounts && google.accounts.oauth2 && google.accounts.oauth2.revoke) {
        try { google.accounts.oauth2.revoke(token, function () {}); } catch (e) { /* ignore */ }
      }
    },
    token() { return current ? current.token : ''; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
