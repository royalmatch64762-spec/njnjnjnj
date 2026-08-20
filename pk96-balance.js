// PK96 Global Shared Balance System
(function() {
  // Global Safe JSON.stringify guard against circular structures
  if (typeof JSON !== 'undefined' && JSON.stringify) {
    const _originalStringify = JSON.stringify;
    JSON.stringify = function(value, replacer, space) {
      try {
        return _originalStringify(value, replacer, space);
      } catch (e) {
        if (e && e.message && (e.message.includes('circular') || e.message.includes('Converting circular structure'))) {
          try {
            const seen = new WeakSet();
            return _originalStringify(value, function(k, v) {
              if (typeof replacer === 'function') {
                v = replacer(k, v);
              }
              if (typeof v === 'object' && v !== null) {
                if (typeof Element !== 'undefined' && (v instanceof Element || v instanceof Node)) {
                  return undefined;
                }
                if (v.constructor && (v.constructor.name === 'HTMLImageElement' || v.constructor.name === 'Image')) {
                  return undefined;
                }
                if (seen.has(v)) return undefined;
                seen.add(v);
              }
              return v;
            }, space);
          } catch (e2) {
            return '{}';
          }
        }
        throw e;
      }
    };
  }

  const BALANCE_KEYS = [
    'pk96_balance',
    'pk96_guest_balance',
    'desertaxebalance',
    'desert_axe_balance',
    'playerbalance',
    'roulette_balance',
    'glass_roulette_balance',
    'neon_spins_balance',
    'rocket_mines_balance',
    'mines_balance',
    'aviator_balance',
    'chicken_road_balance',
    'desert_fortune_balance',
    'flappy_balance',
    'ladders_balance',
    'snakes_balance',
    'snakes2_balance',
    'tiktakwin_balance',
    'tiktak_balance',
    'fortune_jem3_jems_v3'
  ];

  function isBalanceKey(key) {
    if (typeof key !== 'string') return false;
    const lKey = key.toLowerCase();
    if (lKey === 'desertaxehighbalance' || lKey.includes('stats_v') || lKey.includes('history') || lKey.includes('sound')) return false;
    if (BALANCE_KEYS.includes(lKey)) return true;
    if (lKey === 'balance' || lKey.endsWith('balance') || lKey.includes('userbalance') || lKey.includes('playerbalance')) return true;
    return false;
  }

  const origGetItem = Storage.prototype.getItem;
  const origSetItem = Storage.prototype.setItem;
  const origRemoveItem = Storage.prototype.removeItem;
  let isProcessingBalance = false;
  let lastRecordedBalance = null;

  function isAccessibleWindow(win) {
    if (!win || win === window) return false;
    try {
      // Reading win.location or origin will throw DOMException if cross-origin
      return !!(win.location && win.location.origin === window.location.origin);
    } catch(e) {
      return false;
    }
  }

  function isUserLoggedIn() {
    // 1. Direct local storage check
    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        if (u && (u.email || u.uid) && !String(u.uid || '').startsWith('guest_') && u.uid !== 'guest' && u.email !== 'guest@pk96.com' && !u.isGuest) {
          return true;
        }
      }
    } catch(e) {}

    // 2. Safe same-origin parent check
    try {
      if (isAccessibleWindow(window.parent)) {
        if (typeof window.parent.isUserLoggedIn === 'function') {
          return window.parent.isUserLoggedIn();
        }
        if (window.parent.PK96 && typeof window.parent.PK96.getUser === 'function') {
          const pu = window.parent.PK96.getUser();
          if (pu && (pu.email || pu.uid) && !String(pu.uid || '').startsWith('guest_') && pu.uid !== 'guest' && pu.email !== 'guest@pk96.com' && !pu.isGuest) {
            return true;
          }
        }
      }
    } catch(e) {}

    // 3. Safe same-origin opener check
    try {
      if (isAccessibleWindow(window.opener)) {
        if (typeof window.opener.isUserLoggedIn === 'function') {
          return window.opener.isUserLoggedIn();
        }
        if (window.opener.PK96 && typeof window.opener.PK96.getUser === 'function') {
          const ou = window.opener.PK96.getUser();
          if (ou && (ou.email || ou.uid) && !String(ou.uid || '').startsWith('guest_') && ou.uid !== 'guest' && ou.email !== 'guest@pk96.com' && !ou.isGuest) {
            return true;
          }
        }
      }
    } catch(e) {}

    return false;
  }

  function getPK96Balance() {
    const loggedIn = isUserLoggedIn();

    if (!loggedIn) {
      let guestBal = 0;
      try {
        const guestBalStr = origGetItem.call(localStorage, 'pk96_guest_balance');
        if (guestBalStr !== null && guestBalStr !== undefined && !isNaN(Number(guestBalStr))) {
          guestBal = Number(guestBalStr);
        } else {
          const mainBalStr = origGetItem.call(localStorage, 'pk96_balance');
          if (mainBalStr !== null && mainBalStr !== undefined && !isNaN(Number(mainBalStr))) {
            guestBal = Number(mainBalStr);
          } else {
            guestBal = 0;
          }
          origSetItem.call(localStorage, 'pk96_guest_balance', guestBal.toString());
        }
      } catch(e) {
        guestBal = 0;
      }
      const validGuest = Math.max(0, Math.round(guestBal * 100) / 100);
      lastRecordedBalance = validGuest;
      try {
        origSetItem.call(localStorage, 'pk96_balance', validGuest.toString());
      } catch(e) {}
      return validGuest;
    }

    let currentBal = null;

    // 1. Direct local storage check for real user
    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        if (u && typeof u.balance === 'number' && !isNaN(u.balance)) {
          currentBal = u.balance;
        }
      }
      if (currentBal === null) {
        const directBal = origGetItem.call(localStorage, 'pk96_balance');
        if (directBal !== null && directBal !== undefined && !isNaN(Number(directBal))) {
          currentBal = Number(directBal);
        }
      }
    } catch (e) {}

    // 2. Try direct parent PK96 if running in iframe / child window
    if (currentBal === null) {
      try {
        if (isAccessibleWindow(window.parent) && window.parent.PK96 && typeof window.parent.PK96.getBalance === 'function') {
          const pBal = window.parent.PK96.getBalance();
          if (typeof pBal === 'number' && !isNaN(pBal)) {
            currentBal = pBal;
          }
        }
      } catch(e) {}
    }

    // 3. Try window.opener PK96
    if (currentBal === null) {
      try {
        if (isAccessibleWindow(window.opener) && window.opener.PK96 && typeof window.opener.PK96.getBalance === 'function') {
          const oBal = window.opener.PK96.getBalance();
          if (typeof oBal === 'number' && !isNaN(oBal)) {
            currentBal = oBal;
          }
        }
      } catch(e) {}
    }

    if (currentBal === null || isNaN(currentBal)) {
      currentBal = 0;
    }

    const valid = Math.max(0, Math.round(currentBal * 100) / 100);
    lastRecordedBalance = valid;

    // Sync valid balance back into storage
    try {
      if (origGetItem.call(localStorage, 'pk96_balance') !== valid.toString()) {
        origSetItem.call(localStorage, 'pk96_balance', valid.toString());
      }
    } catch(e) {}

    return valid;
  }

  function getPK96TotalBet() {
    const loggedIn = isUserLoggedIn();
    try {
      if (loggedIn) {
        const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
        if (loggedStr) {
          const u = JSON.parse(loggedStr);
          if (u && (u.email || u.uid)) {
            const val = Number(u.totalBets || u.turnover);
            if (!isNaN(val)) return val;
          }
        }
        const directBets = Number(origGetItem.call(localStorage, 'pk96_user_bets'));
        if (!isNaN(directBets) && directBets >= 0) return directBets;
      } else {
        const guestBets = Number(origGetItem.call(localStorage, 'pk96_guest_bets'));
        if (!isNaN(guestBets) && guestBets >= 0) return guestBets;
      }
    } catch(e) {}
    return 0;
  }

  function getPK96TotalDeposit() {
    const loggedIn = isUserLoggedIn();
    try {
      if (loggedIn) {
        const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
        if (loggedStr) {
          const u = JSON.parse(loggedStr);
          if (u && (u.email || u.uid)) {
            const val = Number(u.totalDeposit || u.totalDeposited || u.totalDeposits || u.depositAmount);
            if (!isNaN(val) && val >= 0) return val;
          }
        }
        const directDep = Number(origGetItem.call(localStorage, 'pk96_user_deposits'));
        if (!isNaN(directDep) && directDep >= 0) return directDep;
      } else {
        const guestDep = Number(origGetItem.call(localStorage, 'pk96_guest_deposits'));
        if (!isNaN(guestDep) && guestDep >= 0) return guestDep;
      }
    } catch(e) {}
    return 0;
  }

  function checkAndUpdateReferralValidity(userUid, userEmail, referCode, totalDep, totalBet) {
    const depVal = Number(totalDep) || 0;
    const betVal = Number(totalBet) || 0;
    const isValid = (depVal >= 500 && betVal >= 5000);
    const cleanRefCode = referCode ? String(referCode).trim() : '';

    try {
      const localRefs = JSON.parse(origGetItem.call(localStorage, 'pk96_referral_tracking') || '{}');
      let changed = false;

      // Update in existing referral tracking buckets
      for (const code in localRefs) {
        if (Array.isArray(localRefs[code])) {
          localRefs[code].forEach(ref => {
            if ((ref.uid && userUid && ref.uid === userUid) || (ref.email && userEmail && ref.email.toLowerCase() === userEmail.toLowerCase())) {
              ref.totalDeposit = depVal;
              ref.totalBets = betVal;
              ref.isValid = isValid;
              changed = true;
            }
          });
        }
      }

      // If user had a specific referCode, ensure tracked there
      if (cleanRefCode) {
        if (!localRefs[cleanRefCode]) localRefs[cleanRefCode] = [];
        let existing = localRefs[cleanRefCode].find(r => (userUid && r.uid === userUid) || (userEmail && r.email && r.email.toLowerCase() === userEmail.toLowerCase()));
        if (existing) {
          existing.totalDeposit = depVal;
          existing.totalBets = betVal;
          existing.isValid = isValid;
        } else {
          localRefs[cleanRefCode].push({
            uid: userUid || '',
            email: userEmail || '',
            totalDeposit: depVal,
            totalBets: betVal,
            isValid: isValid,
            date: new Date().toISOString()
          });
        }
        changed = true;
      }

      if (changed) {
        origSetItem.call(localStorage, 'pk96_referral_tracking', JSON.stringify(localRefs));
      }

      // Also update in pk96_registered_users
      if (userEmail) {
        const regUsersStr = origGetItem.call(localStorage, 'pk96_registered_users');
        if (regUsersStr) {
          const regUsers = JSON.parse(regUsersStr);
          const cleanEmail = userEmail.toLowerCase().trim();
          const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
          if (regUsers[cleanEmail]) {
            regUsers[cleanEmail].totalDeposit = depVal;
            regUsers[cleanEmail].totalDeposited = depVal;
            regUsers[cleanEmail].totalBets = betVal;
            regUsers[cleanEmail].turnover = betVal;
            regUsers[cleanEmail].isValid = isValid;
          }
          if (regUsers[emailKey]) {
            regUsers[emailKey].totalDeposit = depVal;
            regUsers[emailKey].totalDeposited = depVal;
            regUsers[emailKey].totalBets = betVal;
            regUsers[emailKey].turnover = betVal;
            regUsers[emailKey].isValid = isValid;
          }
          origSetItem.call(localStorage, 'pk96_registered_users', JSON.stringify(regUsers));
        }
      }

      if (typeof window.updateReferralUI === 'function') {
        window.updateReferralUI();
      }
      if (typeof window.generateInviteRewards === 'function') {
        window.generateInviteRewards();
      }
    } catch(e) {}

    // Sync to Firestore
    try {
      const dbObj = window.db || window.firebaseDb || (isAccessibleWindow(window.parent) && (window.parent.db || window.parent.firebaseDb));
      const docFn = window.doc || (window.firebaseFirestore && window.firebaseFirestore.doc) || (isAccessibleWindow(window.parent) && window.parent.firebaseFirestore && window.parent.firebaseFirestore.doc);
      const setDocFn = window.setDoc || (window.firebaseFirestore && window.firebaseFirestore.setDoc) || (isAccessibleWindow(window.parent) && window.parent.firebaseFirestore && window.parent.firebaseFirestore.setDoc);

      if (dbObj && docFn && setDocFn && userUid) {
        const nowIso = new Date().toISOString();
        const payload = {
          referredUid: userUid,
          referredEmail: userEmail || '',
          referCode: cleanRefCode,
          totalDeposit: depVal,
          totalDeposited: depVal,
          totalBets: betVal,
          turnover: betVal,
          isValid: isValid,
          lastUpdated: nowIso
        };

        setDocFn(docFn(dbObj, "referrals", userUid), payload, { merge: true }).catch(() => {});
        setDocFn(docFn(dbObj, "users", userUid), { totalDeposit: depVal, totalDeposited: depVal, totalBets: betVal, turnover: betVal, isValid: isValid }, { merge: true }).catch(() => {});

        if (cleanRefCode) {
          setDocFn(docFn(dbObj, "referral_stats", cleanRefCode, "referred_users", userUid), {
            uid: userUid,
            email: userEmail || '',
            totalDeposit: depVal,
            totalBets: betVal,
            isValid: isValid,
            lastUpdated: nowIso
          }, { merge: true }).catch(() => {});
        }
      }
    } catch(e) {}
  }

  function recordDeposit(amount) {
    const depAmt = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
    if (depAmt <= 0) return getPK96TotalDeposit();

    const currentDep = getPK96TotalDeposit();
    const newTotal = Math.round((currentDep + depAmt) * 100) / 100;
    const currentBets = getPK96TotalBet();

    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        if (u) {
          u.totalDeposit = newTotal;
          u.totalDeposited = newTotal;
          u.totalDeposits = newTotal;
          origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(u));
          if (u.email) {
            try {
              const regUsersStr = origGetItem.call(localStorage, 'pk96_registered_users');
              if (regUsersStr) {
                const regUsers = JSON.parse(regUsersStr);
                if (regUsers[u.email]) {
                  regUsers[u.email].totalDeposit = newTotal;
                  regUsers[u.email].totalDeposited = newTotal;
                  regUsers[u.email].totalDeposits = newTotal;
                }
                const emailKey = u.email.replace(/[^a-zA-Z0-9]/g, '_');
                if (regUsers[emailKey]) {
                  regUsers[emailKey].totalDeposit = newTotal;
                  regUsers[emailKey].totalDeposited = newTotal;
                  regUsers[emailKey].totalDeposits = newTotal;
                }
                origSetItem.call(localStorage, 'pk96_registered_users', JSON.stringify(regUsers));
              }
            } catch(e) {}
          }
          if (u.uid) {
            try {
              const dbObj = window.db || window.firebaseDb;
              const docFn = window.doc || (window.firebaseFirestore && window.firebaseFirestore.doc);
              const setDocFn = window.setDoc || (window.firebaseFirestore && window.firebaseFirestore.setDoc);
              if (dbObj && docFn && setDocFn) {
                const fsPayload = {
                  totalDeposit: newTotal,
                  totalDeposited: newTotal,
                  totalDeposits: newTotal,
                  balance: typeof u.balance === 'number' ? u.balance : getPK96Balance()
                };
                setDocFn(docFn(dbObj, "users", u.uid), fsPayload, { merge: true }).catch(() => {});
                if (u.email) {
                  const emailKey = u.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                  setDocFn(docFn(dbObj, "users", "email_" + emailKey), fsPayload, { merge: true }).catch(() => {});
                  setDocFn(docFn(dbObj, "users", u.email.toLowerCase().trim()), fsPayload, { merge: true }).catch(() => {});
                }
              }
            } catch(e) {}
          }

          if (u.referredBy) {
            checkAndUpdateReferralValidity(u.uid, u.email, u.referredBy, newTotal, currentBets);
          }
        }
      }
      origSetItem.call(localStorage, 'pk96_user_deposits', newTotal.toString());
      origSetItem.call(localStorage, 'pk96_guest_deposits', newTotal.toString());
    } catch(e) {
      origSetItem.call(localStorage, 'pk96_guest_deposits', newTotal.toString());
      origSetItem.call(localStorage, 'pk96_user_deposits', newTotal.toString());
    }

    try {
      logStep('DEPOSIT_RECORDED', { amount: depAmt, newTotalDeposit: newTotal });
    } catch(e) {}
    return newTotal;
  }

  const VIP_BET_THRESHOLDS = [
    10000, 30000, 50000, 70000, 100000,
    130000, 150000, 180000, 210000, 240000,
    270000, 300000, 330000, 360000, 390000,
    420000, 450000, 490000, 550000, 600000,
    700000
  ];

  function getPK96VipLevel(totalBets) {
    const bets = typeof totalBets === 'number' ? totalBets : getPK96TotalBet();
    if (!bets || bets <= 0) return 0;
    let level = 0;
    for (let i = 0; i < VIP_BET_THRESHOLDS.length; i++) {
      if (bets >= VIP_BET_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return Math.min(20, level);
  }

  let lastRecordedBetTime = 0;
  let lastRecordedBetAmt = 0;

  function recordBet(amount) {
    const betAmt = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
    if (betAmt <= 0) return getPK96TotalBet();

    const now = Date.now();
    
    // Minimal deduplication check (ignore identical calls within 30ms)
    if (now - lastRecordedBetTime < 30 && Math.abs(lastRecordedBetAmt - betAmt) < 0.001) {
      return getPK96TotalBet();
    }

    lastRecordedBetTime = now;
    lastRecordedBetAmt = betAmt;

    const currentBets = getPK96TotalBet();
    const newTotal = Math.round((currentBets + betAmt) * 100) / 100;

    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        if (u) {
          u.totalBets = newTotal;
          u.turnover = newTotal;
          origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(u));
          if (u.email) {
            try {
              const regUsersStr = origGetItem.call(localStorage, 'pk96_registered_users');
              if (regUsersStr) {
                const regUsers = JSON.parse(regUsersStr);
                if (regUsers[u.email]) {
                  regUsers[u.email].totalBets = newTotal;
                  regUsers[u.email].turnover = newTotal;
                }
                const emailKey = u.email.replace(/[^a-zA-Z0-9]/g, '_');
                if (regUsers[emailKey]) {
                  regUsers[emailKey].totalBets = newTotal;
                  regUsers[emailKey].turnover = newTotal;
                }
                origSetItem.call(localStorage, 'pk96_registered_users', JSON.stringify(regUsers));
              }
            } catch(e) {}
          }
          if (u.uid) {
            try {
              const dbObj = window.db || window.firebaseDb;
              const docFn = window.doc || (window.firebaseFirestore && window.firebaseFirestore.doc);
              const setDocFn = window.setDoc || (window.firebaseFirestore && window.firebaseFirestore.setDoc);
              if (dbObj && docFn && setDocFn) {
                const fsPayload = {
                  totalBets: newTotal,
                  turnover: newTotal,
                  balance: typeof u.balance === 'number' ? u.balance : getPK96Balance(),
                  avatar: u.avatar || '',
                  username: u.username || u.displayName || '',
                  displayName: u.displayName || u.username || '',
                  referCode: u.referCode || '',
                  referredBy: u.referredBy || ''
                };
                setDocFn(docFn(dbObj, "users", u.uid), fsPayload, { merge: true }).catch(() => {});
                if (u.email) {
                  const emailKey = u.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                  setDocFn(docFn(dbObj, "users", "email_" + emailKey), fsPayload, { merge: true }).catch(() => {});
                  setDocFn(docFn(dbObj, "users", u.email.toLowerCase().trim()), fsPayload, { merge: true }).catch(() => {});
                }
              }
            } catch(e) {}
          }

          if (u.referredBy) {
            checkAndUpdateReferralValidity(u.uid, u.email, u.referredBy, getPK96TotalDeposit(), newTotal);
          }
        }
      }
      origSetItem.call(localStorage, 'pk96_user_bets', newTotal.toString());
      origSetItem.call(localStorage, 'pk96_guest_bets', newTotal.toString());
    } catch(e) {
      origSetItem.call(localStorage, 'pk96_guest_bets', newTotal.toString());
      origSetItem.call(localStorage, 'pk96_user_bets', newTotal.toString());
    }

    try {
      window.postMessage({ type: 'PK96_BET_UPDATE', totalBets: newTotal, addedBet: betAmt }, '*');
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PK96_BET_UPDATE', totalBets: newTotal, addedBet: betAmt }, '*');
      }
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(f => {
        try {
          if (f.contentWindow) {
            f.contentWindow.postMessage({ type: 'PK96_BET_UPDATE', totalBets: newTotal, addedBet: betAmt }, '*');
          }
        } catch(e) {}
      });
    } catch(e) {}

    if (window.BroadcastChannel) {
      try {
        if (!window.pk96BetChannel) window.pk96BetChannel = new BroadcastChannel('pk96_bet_channel');
        window.pk96BetChannel.postMessage({ type: 'PK96_BET_UPDATE', totalBets: newTotal, addedBet: betAmt });
      } catch(e) {}
    }

    window.dispatchEvent(new CustomEvent('pk96_bet_changed', { detail: { totalBets: newTotal, addedBet: betAmt } }));
    if (typeof window.updateVipUI === 'function') {
      try { window.updateVipUI(); } catch(e) {}
    }
    try {
      logStep('BET_PLACED', { amount: betAmt, newTotalBets: newTotal });
    } catch(e) {}
    return newTotal;
  }

  let isSyncingToFirestore = false;
  let firestoreSyncTimeout = null;

  function syncBalanceToFirestore(u, validBal) {
    if (!u || !u.uid) return;
    if (firestoreSyncTimeout) clearTimeout(firestoreSyncTimeout);
    firestoreSyncTimeout = setTimeout(() => {
      try {
        const dbObj = window.db || window.firebaseDb || (isAccessibleWindow(window.parent) && (window.parent.db || window.parent.firebaseDb));
        const docFn = window.doc || (window.firebaseFirestore && window.firebaseFirestore.doc) || (isAccessibleWindow(window.parent) && window.parent.firebaseFirestore && window.parent.firebaseFirestore.doc);
        const setDocFn = window.setDoc || (window.firebaseFirestore && window.firebaseFirestore.setDoc) || (isAccessibleWindow(window.parent) && window.parent.firebaseFirestore && window.parent.firebaseFirestore.setDoc);
        if (dbObj && docFn && setDocFn) {
          const totalDepVal = Number(u.totalDeposit || u.totalDeposited || u.totalDeposits || getPK96TotalDeposit()) || 0;
          const totalBetVal = Number(u.totalBets || u.turnover || getPK96TotalBet()) || 0;
          const isValidReferral = (totalDepVal >= 500 && totalBetVal >= 5000);
          const fsPayload = {
            balance: validBal,
            totalDeposit: totalDepVal,
            totalDeposited: totalDepVal,
            totalBets: totalBetVal,
            turnover: totalBetVal,
            isValid: isValidReferral,
            avatar: u.avatar || '',
            username: u.username || u.displayName || '',
            displayName: u.displayName || u.username || '',
            referCode: u.referCode || '',
            referredBy: u.referredBy || ''
          };
          setDocFn(docFn(dbObj, "users", u.uid), fsPayload, { merge: true }).catch(() => {});
        }
      } catch(err) {}
    }, 150);
  }

  function setPK96Balance(newBal, isBet = true) {
    const num = Number(newBal);
    if (isNaN(num)) return getPK96Balance();

    const validBal = Math.max(0, Math.round(num * 100) / 100);

    if (lastRecordedBalance === null) {
      lastRecordedBalance = getPK96Balance();
    }

    const isChanged = (Math.abs(lastRecordedBalance - validBal) >= 0.001);

    if (isBet && lastRecordedBalance > validBal) {
      const betAmt = Math.round((lastRecordedBalance - validBal) * 100) / 100;
      recordBet(betAmt);
    }

    lastRecordedBalance = validBal;

    isProcessingBalance = true;
    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      let u = null;
      if (loggedStr) {
        try { u = JSON.parse(loggedStr); } catch(e) {}
      }
      if (!u && isAccessibleWindow(window.parent) && window.parent.PK96 && window.parent.PK96.getUser) {
        try { u = window.parent.PK96.getUser(); } catch(e) {}
      }

      const isRealUser = u && (u.email || u.uid) && !String(u.uid || '').startsWith('guest_') && u.uid !== 'guest' && u.email !== 'guest@pk96.com' && !u.isGuest;

      if (isRealUser) {
        u.balance = validBal;
        origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(u));
        if (u.email) {
          try {
            const regUsersStr = origGetItem.call(localStorage, 'pk96_registered_users');
            if (regUsersStr) {
              const regUsers = JSON.parse(regUsersStr);
              if (regUsers[u.email]) regUsers[u.email].balance = validBal;
              const emailKey = u.email.replace(/[^a-zA-Z0-9]/g, '_');
              if (regUsers[emailKey]) regUsers[emailKey].balance = validBal;
              origSetItem.call(localStorage, 'pk96_registered_users', JSON.stringify(regUsers));
            }
          } catch(err) {}
        }
        if (u.uid && isBet) {
          syncBalanceToFirestore(u, validBal);
        }
      } else {
        origSetItem.call(localStorage, 'pk96_guest_balance', validBal.toString());
      }
      origSetItem.call(localStorage, 'pk96_balance', validBal.toString());
    } catch(e) {} finally {
      isProcessingBalance = false;
    }

    // Direct parent sync
    try {
      if (isAccessibleWindow(window.parent) && window.parent.PK96 && typeof window.parent.PK96.setBalance === 'function' && window.parent.PK96 !== window.PK96) {
        window.parent.PK96.setBalance(validBal, false);
      }
    } catch(e) {}
    try {
      if (isAccessibleWindow(window.top) && window.top.PK96 && typeof window.top.PK96.setBalance === 'function' && window.top.PK96 !== window.PK96) {
        window.top.PK96.setBalance(validBal, false);
      }
    } catch(e) {}

    updateDOMBalances(validBal);

    if (isChanged) {
      try {
        logStep('BALANCE_CHANGE', { newBalance: validBal });
      } catch(e) {}
      try {
        window.dispatchEvent(new CustomEvent('pk96_balance_changed', { detail: { balance: validBal } }));
      } catch(e) {}

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PK96_BALANCE_UPDATE', balance: validBal }, '*');
        }
        if (window.top && window.top !== window && window.top !== window.parent) {
          window.top.postMessage({ type: 'PK96_BALANCE_UPDATE', balance: validBal }, '*');
        }
        if (window.opener) {
          window.opener.postMessage({ type: 'PK96_BALANCE_UPDATE', balance: validBal }, '*');
        }
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => {
          try {
            if (f.contentWindow) {
              f.contentWindow.postMessage({ type: 'PK96_BALANCE_UPDATE', balance: validBal }, '*');
            }
          } catch(e) {}
        });
      } catch(e) {}

      if (window.BroadcastChannel) {
        try {
          if (!window._pk96_bc) window._pk96_bc = new BroadcastChannel('pk96_balance_channel');
          window._pk96_bc.postMessage({ type: 'PK96_BALANCE_UPDATE', balance: validBal });
        } catch(e) {}
      }
    }

    return validBal;
  }

  function updateDOMBalances(bal) {
    const num = Number(bal);
    if (isNaN(num)) return;

    const isInt = Math.floor(num) === num;
    const formatted = isInt ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedDec = num.toFixed(2);

    const targets = [
      'headerUserBalance',
      'profileUserBalance',
      'balanceDisplay',
      'userBalance',
      'balanceAmount',
      'playerBalanceDisplay',
      'header-balance-value',
      'balance-badge',
      'user-balance',
      'balance',
      'current-balance',
      'player-balance',
      'game-balance',
      'gems-display',
      'coins-display',
      'creditDisplay',
      'creditsDisplay',
      'balanceEl',
      'balanceSpan'
    ];

    targets.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const valStr = (el.id.includes('Display') || el.id.includes('value')) && !isInt ? formattedDec : formatted;
        if (id === 'balance-badge') {
          const numSpan = el.querySelector('span') || el;
          if (numSpan && numSpan.textContent !== valStr) {
            numSpan.textContent = valStr;
          }
        } else {
          if (el.textContent !== valStr && !el.textContent.includes('💰')) {
            el.textContent = valStr;
          }
        }
      }
    });

    const classTargets = document.querySelectorAll('.pk96-balance-text, .user-balance-val, .balance-amount, .balance-display, .balance-val, .balance-value, .user-balance, .player-balance');
    classTargets.forEach(el => {
      if (el.textContent !== formatted && el.textContent !== formattedDec) {
        el.textContent = formatted;
      }
    });
  }

  // Intercept Storage getItem
  Storage.prototype.getItem = function(key) {
    if (!isProcessingBalance) {
      if (isBalanceKey(key)) {
        isProcessingBalance = true;
        try {
          return getPK96Balance().toString();
        } finally {
          isProcessingBalance = false;
        }
      }
      
      if (key === 'mines_player_stats_v1' || key === 'fortune_jem3_stats_v3' || key === 'neon_spins_stats') {
        const raw = origGetItem.apply(this, arguments);
        const activeBal = getPK96Balance();
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            obj.balance = activeBal;
            return JSON.stringify(obj);
          } catch(e) {}
        }
        return JSON.stringify({ balance: activeBal, wins: 0, totalSpins: 0, gamesPlayed: 0 });
      }

      if (key === 'aviator_offline_users') {
        const raw = origGetItem.apply(this, arguments);
        const activeBal = getPK96Balance();
        if (raw) {
          try {
            const users = JSON.parse(raw);
            if (Array.isArray(users) && users.length > 0) {
              users.forEach(u => { u.balance = activeBal; });
              return JSON.stringify(users);
            }
          } catch(e) {}
        }
        return JSON.stringify([{ balance: activeBal, name: 'Player' }]);
      }
    }
    return origGetItem.apply(this, arguments);
  };

  // Intercept Storage setItem
  Storage.prototype.setItem = function(key, val) {
    if (!isProcessingBalance) {
      if (isBalanceKey(key)) {
        const num = Number(val);
        if (!isNaN(num)) {
          isProcessingBalance = true;
          try {
            setPK96Balance(num);
          } finally {
            isProcessingBalance = false;
          }
          try {
            origSetItem.call(this, key, val.toString());
          } catch(e) {}
          return;
        }
      }

      if (key === 'mines_player_stats_v1' || key === 'fortune_jem3_stats_v3' || key === 'neon_spins_stats') {
        try {
          const obj = JSON.parse(val);
          if (typeof obj.balance === 'number' && !isNaN(obj.balance)) {
            isProcessingBalance = true;
            try {
              setPK96Balance(obj.balance);
            } finally {
              isProcessingBalance = false;
            }
          }
        } catch(e) {}
      }

      if (key === 'aviator_offline_users') {
        try {
          const users = JSON.parse(val);
          if (Array.isArray(users) && users.length > 0) {
            const activeUser = users[0];
            if (activeUser && typeof activeUser.balance === 'number' && !isNaN(activeUser.balance)) {
              isProcessingBalance = true;
              try {
                setPK96Balance(activeUser.balance);
              } finally {
                isProcessingBalance = false;
              }
            }
          }
        } catch(e) {}
      }
    }
    return origSetItem.apply(this, arguments);
  };

  // Intercept Storage removeItem
  Storage.prototype.removeItem = function(key) {
    if (key === 'pk96_logged_user' || key === 'pk96_balance') {
      lastRecordedBalance = null;
    }
    return origRemoveItem.apply(this, arguments);
  };

  function getPK96User() {
    // 1. Try local localStorage first
    try {
      const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
      if (loggedStr) {
        const u = JSON.parse(loggedStr);
        if (u && (u.email || u.uid) && !String(u.uid || '').startsWith('guest_') && u.uid !== 'guest' && u.email !== 'guest@pk96.com' && !u.isGuest) {
          return {
            uid: u.uid || 'usr_real',
            email: u.email || '',
            username: u.username || u.displayName || (u.email ? u.email.split('@')[0] : 'Player'),
            displayName: u.displayName || u.username || (u.email ? u.email.split('@')[0] : 'Player'),
            avatar: u.avatar || 'https://www.zc777a.com/siteadmin/skin/lobby_asset/common/common/profile/icon_wd_mrtx.avif?manualVersion=1&version=v7.3.232',
            balance: typeof u.balance === 'number' ? u.balance : getPK96Balance(),
            totalBets: Number(u.totalBets || u.turnover) || 0,
            turnover: Number(u.totalBets || u.turnover) || 0,
            vipLevel: getPK96VipLevel(Number(u.totalBets || u.turnover) || 0),
            referCode: u.referCode || '',
            referredBy: u.referredBy || '',
            isGuest: false
          };
        }
      }
    } catch(e) {}

    // 2. Try accessible parent PK96
    try {
      if (isAccessibleWindow(window.parent) && window.parent.PK96 && typeof window.parent.PK96.getUser === 'function' && window.parent.PK96 !== window.PK96) {
        const pu = window.parent.PK96.getUser();
        if (pu && (pu.email || pu.uid) && !String(pu.uid || '').startsWith('guest_') && pu.email !== 'guest@pk96.com' && !pu.isGuest) {
          try {
            origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(pu));
          } catch(e) {}
          return pu;
        }
      }
    } catch(e) {}

    // 3. Try accessible window.opener PK96
    try {
      if (isAccessibleWindow(window.opener) && window.opener.PK96 && typeof window.opener.PK96.getUser === 'function' && window.opener.PK96 !== window.PK96) {
        const ou = window.opener.PK96.getUser();
        if (ou && (ou.email || ou.uid) && !String(ou.uid || '').startsWith('guest_') && ou.email !== 'guest@pk96.com' && !ou.isGuest) {
          try {
            origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(ou));
          } catch(e) {}
          return ou;
        }
      }
    } catch(e) {}

    // 4. Try URL search params (hydrated from lobby on game launch)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const uid = urlParams.get('pk96_uid');
      const email = urlParams.get('pk96_email');
      const user = urlParams.get('pk96_user');
      const bal = Number(urlParams.get('pk96_bal')) || getPK96Balance();
      const bets = Number(urlParams.get('pk96_bets')) || 0;
      if (uid || email) {
        const hydUser = {
          uid: uid ? decodeURIComponent(uid) : (email ? 'usr_' + email.replace(/[^a-zA-Z0-9]/g, '_') : 'usr_real'),
          email: email ? decodeURIComponent(email) : '',
          username: user ? decodeURIComponent(user) : (email ? decodeURIComponent(email).split('@')[0] : 'Player'),
          displayName: user ? decodeURIComponent(user) : (email ? decodeURIComponent(email).split('@')[0] : 'Player'),
          avatar: 'https://www.zc777a.com/siteadmin/skin/lobby_asset/common/common/profile/icon_wd_mrtx.avif?manualVersion=1&version=v7.3.232',
          balance: bal,
          totalBets: bets,
          turnover: bets,
          vipLevel: getPK96VipLevel(bets),
          referCode: '',
          referredBy: '',
          isGuest: false
        };
        try {
          origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(hydUser));
        } catch(e) {}
        return hydUser;
      }
    } catch(e) {}

    // 5. Clean guest user profile fallback
    const gBal = getPK96Balance();
    const gBets = getPK96TotalBet();
    return {
      uid: 'guest',
      email: 'guest@pk96.com',
      username: 'Guest Player',
      displayName: 'Guest Player',
      avatar: 'https://www.zc777a.com/siteadmin/skin/lobby_asset/common/common/profile/icon_wd_mrtx.avif?manualVersion=1&version=v7.3.232',
      balance: gBal,
      totalBets: gBets,
      turnover: gBets,
      vipLevel: 0,
      isGuest: true,
      referCode: '',
      referredBy: ''
    };
  }

  function logStep(actionType, stepData = {}) {
    try {
      const u = getPK96User();
      const uid = u ? u.uid : (window.currentUserUid || "anonymous");
      const email = u ? u.email : "";
      const username = u ? (u.username || u.displayName) : "";
      const currentBal = getPK96Balance();
      const currentBets = getPK96TotalBet();

      const timestamp = new Date().toISOString();
      const stepRecord = {
        uid,
        email,
        username,
        action: actionType || "STEP",
        balance: currentBal,
        totalBets: currentBets,
        timestamp,
        ...stepData
      };

      // Save step to Firestore collection and user doc
      const dbObj = window.db || window.firebaseDb || (window.parent && (window.parent.db || window.parent.firebaseDb));
      const collectionFn = window.collection || (window.firebaseFirestore && window.firebaseFirestore.collection) || (window.parent && window.parent.firebaseFirestore && window.parent.firebaseFirestore.collection);
      const addDocFn = window.addDoc || (window.firebaseFirestore && window.firebaseFirestore.addDoc) || (window.parent && window.parent.firebaseFirestore && window.parent.firebaseFirestore.addDoc);
      const docFn = window.doc || (window.firebaseFirestore && window.firebaseFirestore.doc) || (window.parent && window.parent.firebaseFirestore && window.parent.firebaseFirestore.doc);
      const setDocFn = window.setDoc || (window.firebaseFirestore && window.firebaseFirestore.setDoc) || (window.parent && window.parent.firebaseFirestore && window.parent.firebaseFirestore.setDoc);
      const arrayUnionFn = window.arrayUnion || (window.firebaseFirestore && window.firebaseFirestore.arrayUnion) || (window.parent && window.parent.firebaseFirestore && window.parent.firebaseFirestore.arrayUnion);

      if (dbObj) {
        if (collectionFn && addDocFn) {
          addDocFn(collectionFn(dbObj, "game_steps"), stepRecord).catch(() => {});
        }
        if (uid && uid !== "anonymous" && docFn && setDocFn) {
          const updateObj = {
            lastActive: timestamp,
            lastAction: actionType,
            balance: currentBal,
            totalBets: currentBets,
            turnover: currentBets
          };
          if (arrayUnionFn) {
            updateObj.recentSteps = arrayUnionFn(stepRecord);
          }
          setDocFn(docFn(dbObj, "users", uid), updateObj, { merge: true }).catch(() => {});
          if (email) {
            const emailKey = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            setDocFn(docFn(dbObj, "users", "email_" + emailKey), updateObj, { merge: true }).catch(() => {});
          }
        }
      }

      // Save step locally
      if (uid && uid !== "anonymous") {
        try {
          const histKey = "pk96_user_history_" + uid;
          const existingHist = JSON.parse(origGetItem.call(localStorage, histKey) || "[]");
          existingHist.unshift(stepRecord);
          if (existingHist.length > 100) existingHist.pop();
          origSetItem.call(localStorage, histKey, JSON.stringify(existingHist));
        } catch(e) {}
      }
    } catch(e) {}
  }

  function clearSession() {
    lastRecordedBalance = 0;
    try {
      origSetItem.call(localStorage, 'pk96_balance', '0');
      origSetItem.call(localStorage, 'pk96_guest_balance', '0');
      origSetItem.call(localStorage, 'pk96_guest_bets', '0');
      origSetItem.call(localStorage, 'pk96_guest_deposits', '0');
      origRemoveItem.call(localStorage, 'pk96_logged_user');
      origRemoveItem.call(localStorage, 'pk96_user_bets');
      origRemoveItem.call(localStorage, 'pk96_user_deposits');

      const allKeys = [
        'mines_player_stats_v1',
        'fortune_jem3_stats_v3',
        'neon_spins_stats',
        'aviator_offline_users',
        'desertAxeBalance',
        'desert_axe_balance',
        'desertAxeHighBalance',
        'playerBalance',
        'roulette_balance',
        'glass_roulette_balance',
        'neon_spins_balance',
        'rocket_mines_balance',
        'mines_balance',
        'aviator_balance',
        'chicken_road_balance',
        'desert_fortune_balance',
        'flappy_balance',
        'ladders_balance',
        'snakes_balance',
        'snakes2_balance',
        'tiktakwin_balance',
        'tiktak_balance',
        'fortune_jem3_jems_v3'
      ];
      allKeys.forEach(k => {
        try { origRemoveItem.call(localStorage, k); } catch(e) {}
      });
    } catch(e) {}
    updateDOMBalances(0);
    try {
      window.dispatchEvent(new CustomEvent('pk96_balance_changed', { detail: { balance: 0 } }));
      window.dispatchEvent(new CustomEvent('pk96_bet_changed', { detail: { totalBets: 0 } }));
    } catch(e) {}
  }

  window.PK96 = window.PK96 || {};
  window.PK96.getBalance = getPK96Balance;
  window.PK96.setBalance = setPK96Balance;
  window.PK96.getBets = getPK96TotalBet;
  window.PK96.recordBet = recordBet;
  window.PK96.getDeposits = getPK96TotalDeposit;
  window.PK96.recordDeposit = recordDeposit;
  window.PK96.checkReferral = checkAndUpdateReferralValidity;
  window.PK96.getVipLevel = getPK96VipLevel;
  window.PK96.updateDOM = updateDOMBalances;
  window.PK96.getUser = getPK96User;
  window.PK96.logStep = logStep;
  window.PK96.clearSession = clearSession;
  window.PK96.isLoggedIn = isUserLoggedIn;
  window.getPK96VipLevel = getPK96VipLevel;
  window.getPK96TotalDeposit = getPK96TotalDeposit;
  window.recordDeposit = recordDeposit;

  if (origGetItem.call(localStorage, 'pk96_guest_balance') === null) {
    origSetItem.call(localStorage, 'pk96_guest_balance', '0');
  }

  function handleIncomingBalance(newBal) {
    if (typeof newBal === 'number' && !isNaN(newBal)) {
      const validBal = Math.max(0, Math.round(newBal * 100) / 100);
      if (lastRecordedBalance === null || Math.abs(lastRecordedBalance - validBal) >= 0.001) {
        lastRecordedBalance = validBal;
        isProcessingBalance = true;
        try {
          const loggedStr = origGetItem.call(localStorage, 'pk96_logged_user');
          if (loggedStr) {
            const u = JSON.parse(loggedStr);
            if (u && (u.email || u.uid)) {
              u.balance = validBal;
              origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(u));
              if (u.email) {
                try {
                  const regUsersStr = origGetItem.call(localStorage, 'pk96_registered_users');
                  if (regUsersStr) {
                    const regUsers = JSON.parse(regUsersStr);
                    if (regUsers[u.email]) regUsers[u.email].balance = validBal;
                    const emailKey = u.email.replace(/[^a-zA-Z0-9]/g, '_');
                    if (regUsers[emailKey]) regUsers[emailKey].balance = validBal;
                    origSetItem.call(localStorage, 'pk96_registered_users', JSON.stringify(regUsers));
                  }
                } catch(e) {}
              }
            }
          }
          origSetItem.call(localStorage, 'pk96_balance', validBal.toString());
          origSetItem.call(localStorage, 'pk96_guest_balance', validBal.toString());
        } catch(e) {} finally {
          isProcessingBalance = false;
        }
        updateDOMBalances(validBal);
        window.dispatchEvent(new CustomEvent('pk96_balance_changed', { detail: { balance: validBal } }));
      }
    }
  }

  // Cross-window and iframe messaging synchronization
  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'PK96_REQUEST_SYNC') {
      try {
        const curBal = getPK96Balance();
        const curUser = getPK96User();
        const curBets = getPK96TotalBet();
        const curDeps = getPK96TotalDeposit();
        if (e.source && typeof e.source.postMessage === 'function') {
          e.source.postMessage({
            type: 'PK96_SYNC_RESPONSE',
            balance: curBal,
            user: curUser,
            totalBets: curBets,
            totalDeposits: curDeps
          }, '*');
        }
      } catch(err) {}
    } else if (e.data.type === 'PK96_SYNC_RESPONSE') {
      if (e.data.user) {
        try {
          origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(e.data.user));
        } catch(err) {}
      }
      if (typeof e.data.balance === 'number') {
        handleIncomingBalance(e.data.balance);
      }
      if (typeof e.data.totalBets === 'number') {
        try {
          origSetItem.call(localStorage, 'pk96_user_bets', e.data.totalBets.toString());
        } catch(err) {}
      }
      if (typeof e.data.totalDeposits === 'number') {
        try {
          origSetItem.call(localStorage, 'pk96_user_deposits', e.data.totalDeposits.toString());
        } catch(err) {}
      }
    } else if (e.data.type === 'PK96_BALANCE_UPDATE') {
      if (e.data.user) {
        try {
          origSetItem.call(localStorage, 'pk96_logged_user', JSON.stringify(e.data.user));
        } catch(err) {}
      }
      if (typeof e.data.balance === 'number') {
        handleIncomingBalance(e.data.balance);
      }
      if (typeof e.data.totalBets === 'number') {
        try {
          origSetItem.call(localStorage, 'pk96_user_bets', e.data.totalBets.toString());
        } catch(err) {}
      }
      if (typeof e.data.totalDeposits === 'number') {
        try {
          origSetItem.call(localStorage, 'pk96_user_deposits', e.data.totalDeposits.toString());
        } catch(err) {}
      }
    } else if (e.data.type === 'PK96_BET_UPDATE') {
      const freshBets = getPK96TotalBet();
      window.dispatchEvent(new CustomEvent('pk96_bet_changed', { detail: { totalBets: freshBets, addedBet: e.data.addedBet || 0 } }));
      if (typeof window.updateVipUI === 'function') {
        try { window.updateVipUI(); } catch(err) {}
      }
    } else if ((e.data.type === 'PK96_RECORD_BET' || e.data.type === 'PK96_BET_PLACED') && typeof e.data.amount === 'number') {
      recordBet(e.data.amount);
    }
  });

  if (window.BroadcastChannel) {
    try {
      const bc = new BroadcastChannel('pk96_balance_channel');
      bc.onmessage = function(e) {
        if (e.data && e.data.type === 'PK96_BALANCE_UPDATE') {
          handleIncomingBalance(e.data.balance);
        }
      };
      window._pk96_bc = bc;
    } catch(e) {}

    try {
      const betBc = new BroadcastChannel('pk96_bet_channel');
      betBc.onmessage = function(e) {
        if (e.data && e.data.type === 'PK96_BET_UPDATE') {
          const freshBets = getPK96TotalBet();
          window.dispatchEvent(new CustomEvent('pk96_bet_changed', { detail: { totalBets: freshBets, addedBet: e.data.addedBet || 0 } }));
          if (typeof window.updateVipUI === 'function') {
            try { window.updateVipUI(); } catch(err) {}
          }
        }
      };
    } catch(e) {}
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'pk96_balance' || e.key === 'pk96_logged_user' || isBalanceKey(e.key)) {
      let freshBal = null;
      try {
        if (e.newValue !== null && !isNaN(Number(e.newValue))) {
          freshBal = Number(e.newValue);
        } else if (e.key === 'pk96_logged_user' && e.newValue) {
          const u = JSON.parse(e.newValue);
          if (u && typeof u.balance === 'number') freshBal = u.balance;
        }
      } catch(err) {}

      if (freshBal === null) {
        lastRecordedBalance = null; // reset if key deleted or unparseable
        freshBal = getPK96Balance();
      }

      if (lastRecordedBalance === null || Math.abs(lastRecordedBalance - freshBal) >= 0.001) {
        lastRecordedBalance = freshBal;
        updateDOMBalances(freshBal);
        window.dispatchEvent(new CustomEvent('pk96_balance_changed', { detail: { balance: freshBal } }));
      }
    }

    if (e.key === 'pk96_user_bets' || e.key === 'pk96_guest_bets' || e.key === 'pk96_logged_user') {
      const freshBets = getPK96TotalBet();
      window.dispatchEvent(new CustomEvent('pk96_bet_changed', { detail: { totalBets: freshBets } }));
      if (typeof window.updateVipUI === 'function') {
        try { window.updateVipUI(); } catch(err) {}
      }
    }
  });

  // Non-blocking standalone navigation helper
  function setupStandaloneNavigation() {
    const isLobby = !!document.getElementById('gameGrid') || !!document.getElementById('headerAuthButtons') || !!document.getElementById('gamePage');
    if (isLobby) return;
    
    // Only inject lobby return button if opened standalone (not inside iframe)
    if (window === window.top && !document.getElementById('pk96_standalone_lobby_btn')) {
      const btn = document.createElement('a');
      btn.id = 'pk96_standalone_lobby_btn';
      btn.href = 'index.html';
      btn.title = 'Back to PK96 Lobby';
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Lobby</span>
      `;
      btn.style.cssText = 'position:fixed;top:12px;left:12px;z-index:99999;display:inline-flex;align-items:center;padding:7px 14px;background:rgba(15,23,42,0.88);color:#fff;border:1px solid rgba(255,215,0,0.4);border-radius:20px;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.5);backdrop-filter:blur(8px);transition:all 0.2s ease;font-family:system-ui,-apple-system,sans-serif;opacity:0.85;cursor:pointer;';
      btn.onmouseenter = function() { btn.style.opacity = '1'; btn.style.transform = 'scale(1.05)'; btn.style.borderColor = '#ffd700'; };
      btn.onmouseleave = function() { btn.style.opacity = '0.85'; btn.style.transform = 'scale(1)'; btn.style.borderColor = 'rgba(255,215,0,0.4)'; };
      if (document.body) {
        document.body.appendChild(btn);
      } else {
        document.addEventListener('DOMContentLoaded', () => document.body && document.body.appendChild(btn));
      }
    }
  }

  // Request sync immediately if in iframe
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'PK96_REQUEST_SYNC' }, '*');
    } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateDOMBalances(getPK96Balance());
    setupStandaloneNavigation();
  });

})();


