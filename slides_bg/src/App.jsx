import { useState, useEffect, useCallback } from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'
import bgImage from '../bg.png'
import logoImage from '../logo.png'

const SLIDE_DURATION = 8000
const SLIDE_COUNT = 7

const features = [
  { icon: 'bi-box-seam', title: 'Estoque em Tempo Real', desc: 'Controle completo de matérias-primas, lotes e validades.' },
  { icon: 'bi-bell', title: 'Alertas Inteligentes', desc: 'Notificações de estoque baixo e vencimento próximo.' },
  { icon: 'bi-speedometer2', title: 'Dashboard Completo', desc: 'Indicadores de consumo, compras e produção.' },
  { icon: 'bi-gear-wide-connected', title: 'Produção Sob Demanda', desc: 'Ordens de produção com baixa automática de insumos.' },
  { icon: 'bi-cart-check', title: 'Gestão de Compras', desc: 'Sugestões automáticas de reposição por fornecedor.' },
  { icon: 'bi-graph-up', title: 'Previsões de Consumo', desc: 'Projeções inteligentes para planejar compras.' },
  { icon: 'bi-capsule', title: 'Fórmulas Magistrais', desc: 'Cadastro e gestão de fórmulas com itens e quantidades.' },
  { icon: 'bi-people', title: 'Gestão de Clientes', desc: 'Pedidos e histórico de cada cliente.' }
]

const technologies = [
  { icon: 'bi-lightning-charge', name: 'FastAPI', desc: 'Backend de alta performance com 19 rotas REST' },
  { icon: 'bi-database', name: 'SQLAlchemy', desc: 'ORM em camadas Router → Service → Modelo' },
  { icon: 'bi-hdd-stack', name: 'PostgreSQL 16', desc: 'Banco primário com 18 entidades e views' },
  { icon: 'bi-cloud', name: 'Supabase', desc: 'Fallback na nuvem com failover automático' },
  { icon: 'bi-bar-chart-line', name: 'Pandas', desc: 'Análise de dados e previsões de consumo' },
  { icon: 'bi-boxes', name: 'Docker', desc: 'Deploy em containers: app + banco' }
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [system, setSystem] = useState(null)
  const [database, setDatabase] = useState(null)
  const [supabase, setSupabase] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchData = useCallback(async () => {
    const [sys, db, sup] = await Promise.all([
      fetch('/api/system').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/database').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/supabase').then(r => (r.ok ? r.json() : null)).catch(() => null)
    ])
    if (sys) setSystem(sys)
    if (db) setDatabase(db)
    if (sup) setSupabase(sup)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % SLIDE_COUNT)
        setIsTransitioning(false)
      }, 700)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  const renderSlide = () => {
    switch (current) {
      case 0: return <SlideIntro />
      case 1: return <SlideFeatures />
      case 2: return <SlideTechnologies />
      case 3: return <SlideSystem system={system} />
      case 4: return <SlideDatabase database={database} />
      case 5: return <SlideSupabase supabase={supabase} />
      case 6: return <SlideAbout />
      default: return <SlideIntro />
    }
  }

  return (
    <div className="slideshow" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={`slide-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {renderSlide()}
      </div>
    </div>
  )
}

function SlideIntro() {
  return (
    <div className="slide slide-intro">
      <div className="logo-section">
        <img src={logoImage} alt="AxionPhare" className="logo-img" />
        {/* <p className="project-tagline">Sistema de Gestão para Farmácias de Manipulação</p>
        <div className="divider"></div>
        <p className="project-desc">
          Gestão simples e inteligente para farmácias de manipulação.
          Controle de estoque, validade, compras e produção em uma única plataforma.
        </p> */}
      </div>
    </div>
  )
}

function SlideFeatures() {
  return (
    <div className="slide slide-features">
      <h2 className="slide-title">Funcionalidades</h2>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <i className={`bi ${f.icon} feature-icon`}></i>
            <div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideTechnologies() {
  return (
    <div className="slide slide-technologies">
      <h2 className="slide-title">Tecnologias Utilizadas</h2>
      <div className="tech-grid">
        {technologies.map((t, i) => (
          <div key={i} className="tech-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <i className={`bi ${t.icon} tech-icon`}></i>
            <h3>{t.name}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({ percent }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(Math.max(percent || 0, 0), 100)}%` }}></div>
    </div>
  )
}

function SlideSystem({ system }) {
  const loadPerCore = system && system.cpu.cores > 0
    ? (system.load.m1 / system.cpu.cores).toFixed(2)
    : null

  return (
    <div className="slide slide-system">
      <h2 className="slide-title">Hardware em Tempo Real</h2>
      {system ? (
        <>
          <div className="system-grid">
            <div className="system-card">
              <i className="bi bi-cpu system-icon"></i>
              <h3>CPU</h3>
              <p className="system-value">{system.cpu.usage}%</p>
              <ProgressBar percent={system.cpu.usage} />
              <p className="system-detail">{system.cpu.cores} núcleos — {system.cpu.model}</p>
              <p className="system-detail">{system.cpu.freq ? `${(system.cpu.freq / 1000).toFixed(2)} GHz` : 'Frequência N/D'}</p>
            </div>
            <div className="system-card">
              <i className="bi bi-memory system-icon"></i>
              <h3>Memória RAM</h3>
              <p className="system-value">{system.memory.percent}%</p>
              <ProgressBar percent={system.memory.percent} />
              <p className="system-detail">{system.memory.used} GB / {system.memory.total} GB em uso</p>
              <p className="system-detail">
                {parseFloat(system.swap.total) > 0
                  ? `Swap ${system.swap.used} GB / ${system.swap.total} GB (${system.swap.percent}%)`
                  : 'Sem swap configurado'}
              </p>
            </div>
            <div className="system-card">
              <i className="bi bi-device-hdd system-icon"></i>
              <h3>Armazenamento</h3>
              <p className="system-value">{system.disk.percent}%</p>
              <ProgressBar percent={system.disk.percent} />
              <p className="system-detail">{system.disk.used} GB / {system.disk.total} GB usados</p>
              <p className="system-detail">{system.disk.free} GB livres em {system.disk.mount}</p>
            </div>
            <div className="system-card">
              <i className="bi bi-activity system-icon"></i>
              <h3>Carga do Sistema</h3>
              <p className="system-value">{system.load.m1}</p>
              <p className="system-detail">1 min · {system.load.m5} (5 min) · {system.load.m15} (15 min)</p>
              <p className="system-detail">{loadPerCore !== null ? `${loadPerCore} por núcleo` : 'Carga média dos últimos minutos'}</p>
            </div>
          </div>
          <div className="system-meta">
            <span><i className="bi bi-hdd-network"></i>{system.hostname}</span>
            <span><i className="bi bi-window"></i>{system.platform}</span>
            <span><i className="bi bi-cpu"></i>{system.arch}</span>
            <span><i className="bi bi-arrow-repeat"></i>Atualizado a cada 5s</span>
          </div>
        </>
      ) : (
        <div className="loading-data">Conectando ao servidor...</div>
      )}
    </div>
  )
}

function SlideDatabase({ database }) {
  const countLabels = {
    clientes: 'Clientes',
    materias_primas: 'Matérias-Primas',
    fornecedores: 'Fornecedores',
    formulas: 'Fórmulas',
    lotes: 'Lotes',
    pedidos: 'Pedidos',
    compras: 'Compras',
    alertas: 'Alertas',
    ordens_producao: 'Ordens de Produção'
  }

  return (
    <div className="slide slide-database">
      <h2 className="slide-title">Banco de Dados</h2>
      {database ? (
        <>
          <div className="db-info-bar">
            <span className="db-badge">{database.type}</span>
            <span className="db-version">{database.version}</span>
            <span className="db-tables">{database.totalTables} tabelas</span>
          </div>
          <div className="counts-grid">
            {Object.entries(database.counts).map(([key, val]) => (
              <div key={key} className="count-card">
                <p className="count-value">{val.toLocaleString('pt-BR')}</p>
                <p className="count-label">{countLabels[key] || key}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="loading-data">Conectando ao banco de dados...</div>
      )}
    </div>
  )
}

function SlideSupabase({ supabase }) {
  const failover = supabase?.failover
  const status = !supabase
    ? { label: 'Verificando...', cls: '' }
    : !supabase.configured
      ? { label: 'Não configurado', cls: 'is-warn' }
      : supabase.online
        ? { label: 'Online', cls: 'is-ok' }
        : { label: 'Offline', cls: 'is-down' }

  const activeDb = failover
    ? failover.banco_ativo === 'supabase' ? 'Supabase (fallback)' : 'Primário (local)'
    : '—'

  const metrics = [
    { label: 'Latência REST', value: supabase?.latencyMs != null ? `${supabase.latencyMs} ms` : '—' },
    { label: 'Projeto', value: supabase?.projectRef || '—' },
    { label: 'Banco ativo', value: activeDb },
    { label: 'Primário disponível', value: failover ? (failover.primario_disponivel ? 'Sim' : 'Não') : '—' },
    { label: 'Failovers', value: failover ? failover.total_failovers : '—' },
    { label: 'Recuperações', value: failover ? failover.total_recuperacoes : '—' }
  ]

  return (
    <div className="slide slide-supabase">
      <h2 className="slide-title">Supabase — Banco de Dados na Nuvem</h2>
      {!supabase ? (
        <div className="loading-data">Verificando conexão com o Supabase...</div>
      ) : (
        <div className="supabase-layout">
          <div className="supabase-info">
            <p className="about-highlight">
              Alta disponibilidade sem custo extra: o mesmo banco roda local e no Supabase como plano B.
            </p>
            <ul className="about-list">
              <li><i className="bi bi-check-lg"></i> Postgres local é o banco primário de toda a aplicação</li>
              <li><i className="bi bi-check-lg"></i> Se o primário cair, o sistema migra sozinho para o Supabase (REST)</li>
              <li><i className="bi bi-check-lg"></i> Health check a cada 10s com cooldown de 15s — volta ao primário automático</li>
              <li><i className="bi bi-check-lg"></i> Configurado por <code>SUPABASE_URL</code> e <code>SUPABASE_SECRET_KEY</code></li>
              <li><i className="bi bi-check-lg"></i> Contadores de failover expostos em <code>/diagnosticos/status_banco</code></li>
            </ul>
            {supabase.error && <p className="supabase-error"><i className="bi bi-exclamation-circle"></i> {supabase.error}</p>}
          </div>
          <div className="supabase-panel">
            <div className={`supabase-status ${status.cls}`}>
              <span className="status-dot"></span>
              <span className="status-label">{status.label}</span>
              <span className="status-endpoint">/rest/v1/</span>
            </div>
            <div className="supabase-metrics">
              {metrics.map((m, i) => (
                <div key={i} className="supabase-card">
                  <p className="supabase-value">{String(m.value)}</p>
                  <p className="supabase-label">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SlideAbout() {
  const stats = [
    { value: '19', label: 'rotas REST' },
    { value: '18', label: 'entidades no banco' },
    { value: '17', label: 'telas na SPA' },
    { value: '24', label: 'scripts SQL' },
    { value: '3', label: 'views prontas' },
    { value: '1', label: 'script de instalação' }
  ]

  const columns = [
    {
      icon: 'bi-exclamation-diamond',
      title: 'O problema',
      items: [
        'Perda de dinheiro com insumos que vencem e são descartados',
        'Faltas de material atrasam a entrega das fórmulas',
        'Compras no "achismo", sem saber o consumo real',
        'Planilhas manuais, sem visão geral do estoque'
      ]
    },
    {
      icon: 'bi-check2-square',
      title: 'O que o sistema entrega',
      items: [
        'Estoque em tempo real por lote, com princípio FEFO',
        'Compras e ordens de produção com baixa automática',
        'Previsões de consumo (média móvel de 6 meses) e sugestões de compra',
        'Alertas de validade e dashboard com indicadores'
      ]
    },
    {
      icon: 'bi-diagram-3',
      title: 'Arquitetura',
      items: [
        'FastAPI + SQLAlchemy no padrão Router → Service → ORM',
        'SPA com Bootstrap 5, ApexCharts e cache offline',
        'PostgreSQL 16 primário + Supabase como fallback',
        'Docker Compose (app + banco) e instalação em um único SQL'
      ]
    }
  ]

  return (
    <div className="slide slide-about">
      <h2 className="slide-title">Sobre o Projeto</h2>
      <div className="about-content">
        <p className="about-highlight">
          AxionPhare é um sistema completo de gestão para farmácias de manipulação de pequeno porte —
          do insumo comprado até a fórmula entregue ao paciente.
        </p>
        <div className="about-columns">
          {columns.map((col, i) => (
            <div key={i} className="about-col" style={{ animationDelay: `${i * 0.1}s` }}>
              <h3><i className={`bi ${col.icon}`}></i>{col.title}</h3>
              <ul className="about-list">
                {col.items.map((item, j) => (
                  <li key={j}><i className="bi bi-dot"></i>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="about-stats">
          {stats.map((s, i) => (
            <div key={i} className="about-stat">
              <p className="about-stat-value">{s.value}</p>
              <p className="about-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
