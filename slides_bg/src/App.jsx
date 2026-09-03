import { useState, useEffect, useCallback, useMemo } from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'
import bgImage from '../bg.png'
import logoImage from '../logo.png'

const SLIDE_DURATION = 8000

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
  { icon: 'bi-lightning-charge', name: 'FastAPI', desc: 'Framework backend de alta performance' },
  { icon: 'bi-database', name: 'SQLAlchemy', desc: 'ORM para mapeamento objeto-relacional' },
  { icon: 'bi-hdd-stack', name: 'Postgres', desc: 'Banco de dados robusto e confiável' },
  { icon: 'bi-bar-chart-line', name: 'Pandas', desc: 'Análise e processamento de dados' }
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [system, setSystem] = useState(null)
  const [database, setDatabase] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [sysRes, dbRes] = await Promise.all([
        fetch('/api/system'),
        fetch('/api/database')
      ])
      if (sysRes.ok) setSystem(await sysRes.json())
      if (dbRes.ok) setDatabase(await dbRes.json())
    } catch {}
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
        setCurrent(prev => (prev + 1) % 6)
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
      case 5: return <SlideAbout />
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

function SlideSystem({ system }) {
  return (
    <div className="slide slide-system">
      <h2 className="slide-title">Hardware em Tempo Real</h2>
      {system ? (
        <div className="system-grid">
          <div className="system-card">
            <i className="bi bi-cpu system-icon"></i>
            <h3>CPU</h3>
            <p className="system-value">{system.cpu.usage}%</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${system.cpu.usage}%` }}></div>
            </div>
            <p className="system-detail">{system.cpu.cores} cores — {system.cpu.model}</p>
          </div>
          <div className="system-card">
            <i className="bi bi-memory system-icon"></i>
            <h3>Memória RAM</h3>
            <p className="system-value">{system.memory.percent}%</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${system.memory.percent}%` }}></div>
            </div>
            <p className="system-detail">{system.memory.used}GB / {system.memory.total}GB</p>
          </div>
          <div className="system-card">
            <i className="bi bi-clock-history system-icon"></i>
            <h3>Uptime</h3>
            <p className="system-value">{system.uptime}</p>
            <p className="system-detail">{system.platform} — {system.hostname}</p>
          </div>
        </div>
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

function SlideAbout() {
  return (
    <div className="slide slide-about">
      <h2 className="slide-title">Sobre o Projeto</h2>
      <div className="about-content">
        <div className="about-text">
          <p className="about-highlight">
            Sistema completo de gestão para farmácias de manipulação de pequeno porte.
          </p>
          <ul className="about-list">
            <li><i className="bi bi-check-lg"></i> Controle de estoque com princípio FEFO</li>
            <li><i className="bi bi-check-lg"></i> Sugestões inteligentes de compra</li>
            <li><i className="bi bi-check-lg"></i> Previsões de consumo com machine learning</li>
            <li><i className="bi bi-check-lg"></i> Dashboard com indicadores em tempo real</li>
            <li><i className="bi bi-check-lg"></i> Instalação via Docker, rodando localmente</li>
          </ul>
        </div>
        <div className="about-footer">
          <p className="about-cta">Gestão simples e inteligente</p>
        </div>
      </div>
    </div>
  )
}
