import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { Client } from 'ssh2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USUARIO,
  password: process.env.DB_SENHA,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_SCHEM
});

function sshExec(cmd) {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    ssh.on('ready', () => {
      ssh.exec(cmd, (err, stream) => {
        if (err) { ssh.end(); return reject(err); }
        let data = '';
        stream.on('data', (chunk) => { data += chunk.toString(); });
        stream.stderr.on('data', (chunk) => { data += chunk.toString(); });
        stream.on('close', () => { ssh.end(); resolve(data.trim()); });
      });
    });
    ssh.on('error', reject);
    ssh.connect({
      host: process.env.SSH_HOST,
      port: parseInt(process.env.SSH_PORT || '22'),
      username: process.env.SSH_USER,
      password: process.env.SSH_PASSWORD
    });
  });
}

const HARDWARE_SCRIPT = [
  `echo CPU_USAGE=$( { awk '/^cpu /{print $2+$3+$4+$5+$6+$7+$8, $5+$6}' /proc/stat; sleep 1; awk '/^cpu /{print $2+$3+$4+$5+$6+$7+$8, $5+$6}' /proc/stat; } | awk 'NR==1{t1=$1;i1=$2} NR==2{d=$1-t1;di=$2-i1; if(d>0) printf "%.1f", (1-di/d)*100; else printf "0"}' )`,
  `echo CPU_MODEL=$(grep -m1 "model name" /proc/cpuinfo | cut -d: -f2- | xargs)`,
  `echo CPU_FREQ=$(grep -m1 "cpu MHz" /proc/cpuinfo | cut -d: -f2- | xargs)`,
  `echo CPU_CORES=$(nproc)`,
  `echo MEM=$(free -b | awk '/Mem:/{printf "%s %s %s", $2, $3, $4}')`,
  `echo SWAP=$(free -b | awk '/Swap:/{printf "%s %s", $2, $3}')`,
  `echo DISK=$(df -P / | awk 'NR==2{printf "%s %s", $2, $3}')`,
  `echo LOAD=$(cut -d" " -f1-3 /proc/loadavg)`,
  `echo HOST=$(hostname)`,
  `echo KERNEL=$(uname -sr)`,
  `echo ARCH=$(uname -m)`
].join('; ');

function parseKeyValues(raw) {
  const out = {};
  for (const line of String(raw || '').split('\n')) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value) out[key] = value;
  }
  return out;
}

const toGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);
const percentOf = (used, total) => (total > 0 ? parseFloat(((used / total) * 100).toFixed(1)) : 0);

app.get('/api/system', async (req, res) => {
  try {
    const raw = await sshExec(HARDWARE_SCRIPT);
    const vars = parseKeyValues(raw);

    const [memTotal, memUsed, memFree] = (vars.MEM || '').split(' ').map(v => parseInt(v) || 0);
    const [swapTotal, swapUsed] = (vars.SWAP || '').split(' ').map(v => parseInt(v) || 0);
    const [diskTotalBlocks, diskUsedBlocks] = (vars.DISK || '').split(' ').map(v => parseInt(v) || 0);
    const diskTotal = diskTotalBlocks * 1024;
    const diskUsed = diskUsedBlocks * 1024;
    const [load1, load5, load15] = (vars.LOAD || '').split(/\s+/);

    res.json({
      cpu: {
        model: vars.CPU_MODEL || 'N/A',
        cores: parseInt(vars.CPU_CORES) || 0,
        usage: parseFloat(vars.CPU_USAGE) || 0,
        freq: parseFloat(vars.CPU_FREQ) || 0
      },
      memory: {
        total: toGB(memTotal),
        used: toGB(memUsed),
        free: toGB(memFree),
        percent: percentOf(memUsed, memTotal)
      },
      swap: {
        total: toGB(swapTotal),
        used: toGB(swapUsed),
        percent: percentOf(swapUsed, swapTotal)
      },
      disk: {
        total: toGB(diskTotal),
        used: toGB(diskUsed),
        free: toGB(diskTotal - diskUsed),
        percent: percentOf(diskUsed, diskTotal),
        mount: '/'
      },
      load: {
        m1: parseFloat(load1) || 0,
        m5: parseFloat(load5) || 0,
        m15: parseFloat(load15) || 0
      },
      platform: vars.KERNEL || 'N/A',
      arch: vars.ARCH || 'N/A',
      hostname: vars.HOST || 'N/A'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter dados do servidor via SSH', details: err.message });
  }
});

app.get('/api/supabase', async (req, res) => {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SECRET_KEY || '';
  const result = {
    configured: Boolean(url && key),
    online: false,
    projectRef: null,
    restStatus: null,
    latencyMs: null,
    error: null,
    failover: null
  };

  if (result.configured) {
    try {
      result.projectRef = new URL(url).hostname.split('.')[0];
      const started = Date.now();
      const response = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000)
      });
      result.latencyMs = Date.now() - started;
      result.restStatus = response.status;
      result.online = response.ok;
      if (!response.ok) result.error = `HTTP ${response.status}`;
      await response.text().catch(() => {});
    } catch (err) {
      result.error = err.message;
    }
  } else {
    result.error = 'SUPABASE_URL / SUPABASE_SECRET_KEY não configurados';
  }

  const apiUrl = process.env.APP_API_URL;
  if (apiUrl) {
    try {
      const response = await fetch(new URL('/diagnosticos/status_banco', apiUrl), {
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) result.failover = await response.json();
    } catch {}
  }

  res.json(result);
});

app.get('/api/database', async (req, res) => {
  try {
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables = tablesQuery.rows.map(r => r.table_name);

    const counts = {};
    const countable = ['clientes', 'materias_primas', 'fornecedores', 'formulas', 'lotes', 'pedidos', 'compras', 'alertas', 'ordens_producao'];
    for (const table of countable) {
      if (tables.includes(table)) {
        const result = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
        counts[table] = parseInt(result.rows[0].total);
      }
    }

    const dbInfo = await pool.query(`SELECT version() as version`);

    res.json({
      type: 'PostgreSQL',
      version: dbInfo.rows[0].version,
      totalTables: tables.length,
      tables,
      counts
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao conectar com o banco de dados', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
