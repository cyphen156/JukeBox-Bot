// storage/crypto.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALGO   = 'aes-256-gcm';   // algorithm
const IV_LEN = 12;

function ok(value)
{
  return { ok: true, value };
}

function err(code, message, detail)
{
  return { ok: false, code, message, detail };
}

function loadConfig()
{
  try
  {
    const p = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(p))
    {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  catch {}
  return {};
}

function loadMasterKeyHex()
{
    // 서비스 환경 먼저 시도
  const fromEnv = process.env.MASTER_KEY;
  if (fromEnv && /^[0-9a-fA-F]{64}$/.test(fromEnv))
  {
    return ok(fromEnv.toLowerCase());
  }

  // 서비스 환경 실패시 개발 환경 시도
  const config = loadConfig();
  const fromConfig = config.crypto && config.crypto.masterKey;
  if (fromConfig && /^[0-9a-fA-F]{64}$/.test(fromConfig))
  {
    return ok(fromConfig.toLowerCase());
  }

  return err('NO_KEY', 'MASTER_KEY(64 hex)가 설정되지 않았습니다.');
}

function loadKeyBuffer()
{
  const r = loadMasterKeyHex();
  if (!r.ok)
  {
    return r;
  }
  const buf = Buffer.from(r.value, 'hex');
  if (buf.length !== 32)
  {
    return err('BAD_KEYLEN', `MASTER_KEY 길이=${buf.length}B (필요:32B)`);
  }
  return ok(buf);
}

function encryptJson(obj)
{
  const k = loadKeyBuffer();
  if (!k.ok)
  {
    return err('ENC_KEY', '암호화 키 로딩 실패', k);
  }

  try
  {
    const iv  = crypto.randomBytes(IV_LEN);
    const cip = crypto.createCipheriv(ALGO, k.value, iv);

    const plain = Buffer.from(JSON.stringify(obj), 'utf8');
    const enc1  = cip.update(plain);
    const enc2  = cip.final();
    const tag   = cip.getAuthTag();

    return ok({
      keyVersion: process.env.KEY_VERSION ?? 'v1',
      algo      : ALGO,
      iv        : iv.toString('base64'),
      tag       : tag.toString('base64'),
      data      : Buffer.concat([enc1, enc2]).toString('base64'),
    });
  }
  catch (e)
  {
    return err('ENC_FAIL', '암호화 실패', e);
  }
}

function decryptJson(payload)
{
  const k = loadKeyBuffer();
  if (!k.ok)
  {
    return err('DEC_KEY', '복호화 키 로딩 실패', k);
  }

  if (payload.algo && payload.algo !== ALGO)
  {
    return err('BAD_ALGO', `지원하지 않는 알고리즘: ${payload.algo}`);
  }

  try
  {
    const iv  = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const dat = Buffer.from(payload.data, 'base64');

    const dec = crypto.createDecipheriv(ALGO, k.value, iv);
    dec.setAuthTag(tag);

    const d1 = dec.update(dat);
    const d2 = dec.final();
    const json = Buffer.concat([d1, d2]).toString('utf8');
    return ok(JSON.parse(json));
  }
  catch (e)
  {
    return err('DEC_FAIL', '복호화 실패(키/태그/포맷 확인)', e);
  }
}

module.exports =
{
  encryptJson,
  decryptJson,
  loadKeyBuffer,
  ok,
  err,
};
