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

app.get('/api/system', async (req, res) => {
  try {
    const cpuScript = `top -bn1 | head -5 | grep "Cpu(s)" | awk '{print $2}'`;
    const memScript = `free -b | awk '/Mem:/{printf "%s %s %s", $2, $3, $4}'`;
    const uptimeScript = `uptime -p`;
    const hostScript = `hostname`;
    const platformScript = `uname -s`;
    const modelScript = `cat /proc/cpuinfo | grep "model name" | head -1 | cut -d: -f2 | xargs`;
    const coresScript = `nproc`;

    const [cpuRaw, memRaw, uptimeRaw, hostRaw, platformRaw, modelRaw, coresRaw] = await Promise.all([
      sshExec(cpuScript),
      sshExec(memScript),
      sshExec(uptimeScript),
      sshExec(hostScript),
      sshExec(platformScript),
      sshExec(modelScript),
      sshExec(coresScript)
    ]);

    const cpuUsage = parseFloat(cpuRaw) || 0;
    const [memTotal, memUsed, memFree] = memRaw.split(' ').map(v => parseInt(v) || 0);
    const memPercent = memTotal > 0 ? ((memUsed / memTotal) * 100).toFixed(1) : '0';

    res.json({
      cpu: {
        model: modelRaw || 'N/A',
        cores: parseInt(coresRaw) || 0,
        usage: cpuUsage
      },
      memory: {
        total: (memTotal / (1024 ** 3)).toFixed(2),
        used: (memUsed / (1024 ** 3)).toFixed(2),
        free: (memFree / (1024 ** 3)).toFixed(2),
        percent: parseFloat(memPercent)
      },
      uptime: uptimeRaw.replace('up ', ''),
      platform: platformRaw,
      hostname: hostRaw
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter dados do servidor via SSH', details: err.message });
  }
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
