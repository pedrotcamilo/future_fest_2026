import logoImage from '../logo_aurafarma.png'
import mvpEstoque from './assets/aurafarma/mvp-estoque.png'
import mvpPdv from './assets/aurafarma/mvp-pdv.png'
import mvpPedidos from './assets/aurafarma/mvp-pedidos.png'
import mvpDashboard from './assets/aurafarma/mvp-dashboard.png'
import mvpRelatorios from './assets/aurafarma/mvp-relatorios.png'

/**
 * Logotipo temporário do AuraFarma.
 * O logotipo oficial ainda não está disponível; enquanto isso usamos o da AxionPhare.
 * Para trocar quando o oficial existir: basta alterar a constante abaixo.
 */
export const AURA_LOGO = logoImage
const AURA_LOGO_ALT = 'AuraFarma — logotipo temporário (AxionPhare)'

function AuraSlide({ kicker, title, subtitle, children, className = '' }) {
  return (
    <div className={`slide aura-slide ${className}`}>
      <header className="aura-header">
        {/* Logotipo temporário da AxionPhare — será substituído pelo oficial */}
        <img src={AURA_LOGO} alt={AURA_LOGO_ALT} className="aura-logo" />
      </header>
      <div className="aura-body">
        {kicker && <p className="aura-kicker">{kicker}</p>}
        {(title || subtitle) && (
          <h2 className="slide-title aura-title">
            {title}
            {subtitle && <span className="aura-title-sub">{subtitle}</span>}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}

/* ── Abertura ─────────────────────────────────────────────────────────── */
function AuraIntro() {
  return (
    <div className="slide slide-intro aura-intro">
      <div className="logo-section">
        <img src={AURA_LOGO} alt={AURA_LOGO_ALT} className="logo-img" />
      </div>
    </div>
  )
}

/* ── Clientes + estudo de mercado ─────────────────────────────────────── */
const PROBLEMS = [
  { label: 'Gestão de estoque', value: '42,9%', color: '#f26a21', delay: 0 },
  { label: 'Atendimento ao cliente', value: '28,6%', color: '#d9541c', delay: 0.06 },
  { label: 'Alto custo', value: '14,3%', color: '#b34318', delay: 0.12 },
  { label: 'Falta de funcionários', value: '14,3%', color: '#f7a05a', delay: 0.18 }
]

function AuraClients() {
  return (
    <AuraSlide kicker="Estudo de mercado" title="Clientes" className="aura-clients">
      <div className="aura-clients-grid">
        <div className="aura-clients-left">
          <p className="aura-eyebrow">Segmentos de clientes</p>
          <p className="aura-statement">
            Farmácias de pequeno/médio porte que não possuem sistema de administração próprios
          </p>
          <div className="aura-tags">
            <span className="aura-tag aura-tag--accent">B2B</span>
            <span className="aura-tag">Farmácias pequenas x farmácias grandes</span>
          </div>
        </div>

        <div className="aura-market">
          <p className="aura-eyebrow">Principais problemas relatados</p>
          <div className="aura-market-grid">
            <div className="aura-donut" role="img" aria-label="Gestão de estoque 42,9%; atendimento ao cliente 28,6%; alto custo 14,3%; falta de funcionários 14,3%">
              <div className="aura-donut-hole"></div>
            </div>
            <ul className="aura-legend">
              {PROBLEMS.map((p) => (
                <li key={p.label} className="aura-legend-item">
                  <span className="aura-legend-dot" style={{ background: p.color }}></span>
                  <span className="aura-legend-label">{p.label}</span>
                  <span className="aura-legend-value">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuraSlide>
  )
}

/* ── Dores → resultados ───────────────────────────────────────────────── */
const PAINS = [
  { pain: 'Processos analógicos', gain: 'automação' },
  { pain: 'Funcionários sobrecarregados', gain: 'redução nas demandas' },
  { pain: 'Piora no atendimento ao cliente', gain: 'melhor performance' },
  { pain: 'Menor retorno para a farmácia', gain: 'converte mais lucro' }
]

function AuraPains() {
  return (
    <AuraSlide kicker="Clientes · dores identificadas" title="Das dores aos resultados" className="aura-pains">
      <p className="aura-lead aura-lead--tight">
        Dores identificadas no estudo de mercado — e o que cada uma passa a valer com uma
        administração automatizada.
      </p>
      <div className="aura-pain-grid">
        {PAINS.map((p, i) => (
          <div className="aura-pain-card" key={p.pain} style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="aura-pain-index">0{i + 1}</span>
            <p className="aura-pain-name">{p.pain}</p>
            <i className="bi bi-arrow-right aura-pain-arrow"></i>
            <p className="aura-pain-gain">{p.gain}</p>
          </div>
        ))}
      </div>
    </AuraSlide>
  )
}

/* ── Proposta de valor ────────────────────────────────────────────────── */
const VALUE = [
  { icon: 'bi-gear-wide-connected', label: 'Automação', text: 'Solução automatizada de administração' },
  { icon: 'bi-box-seam', label: 'Estoque e logística', text: 'Gerência de estoque e logística' },
  { icon: 'bi-building', label: 'Modelo', text: 'B2B' },
  { icon: 'bi-grid-1x2', label: 'Gestão', text: 'ERP' }
]

function AuraValue() {
  return (
    <AuraSlide kicker="Solução · proposta de valor" title="Proposta de valor" className="aura-value">
      <div className="aura-value-grid">
        {VALUE.map((v, i) => (
          <div
            className={`aura-value-card ${i < 2 ? 'aura-value-card--hero' : ''}`}
            key={v.text}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <i className={`bi ${v.icon} aura-value-icon`}></i>
            <div>
              <p className="aura-eyebrow">{v.label}</p>
              <p className="aura-value-text">{v.text}</p>
            </div>
          </div>
        ))}
      </div>
    </AuraSlide>
  )
}

/* ── Plataforma e integrações ─────────────────────────────────────────── */
const PLATFORM = [
  { icon: 'bi-shield-check', name: 'SNGPC', status: 'Pendente' },
  { icon: 'bi-receipt', name: 'API NF-E', status: 'Pendente' },
  { icon: 'bi-bar-chart-line', name: 'Recursos de BI' },
  { icon: 'bi-stars', name: 'Assistente de IA' },
  { icon: 'bi-upc-scan', name: 'Integração PDV' },
  { icon: 'bi-shop', name: 'Omnichannel' }
]

function AuraPlatform() {
  return (
    <AuraSlide kicker="Solução · plataforma" title="Plataforma e integrações" className="aura-platform">
      <p className="aura-lead aura-lead--tight">
        Solução automatizada de administração, com gerência de estoque e logística.
      </p>
      <div className="aura-platform-grid">
        {PLATFORM.map((p, i) => (
          <div className="aura-platform-card" key={p.name} style={{ animationDelay: `${i * 0.07}s` }}>
            <i className={`bi ${p.icon} aura-platform-icon`}></i>
            <p className="aura-platform-name">{p.name}</p>
            {p.status && <span className="aura-status">{p.status}</span>}
          </div>
        ))}
      </div>
    </AuraSlide>
  )
}

/* ── Modelo operacional ───────────────────────────────────────────────── */
const OPERATION_GROUPS = [
  {
    title: 'Recursos',
    items: [
      { icon: 'bi-hdd-network', text: 'Hosting e Server — front-end / back-end' },
      { icon: 'bi-stars', text: 'API — IA' }
    ]
  },
  {
    title: 'Atividades',
    items: [
      { icon: 'bi-megaphone', text: 'Marketing digital' },
      { icon: 'bi-code-slash', text: 'Desenvolvimento e Manutenção do sistema' }
    ]
  }
]

function AuraOperation() {
  return (
    <AuraSlide kicker="Solução · product proposal" title="Modelo operacional" className="aura-operation">
      <div className="aura-op-layout">
        {OPERATION_GROUPS.map((group) => (
          <div className="aura-op-group" key={group.title}>
            <p className="aura-eyebrow">{group.title}</p>
            <ul className="aura-op-items">
              {group.items.map((item) => (
                <li key={item.text}>
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="aura-op-bracket">
          <span className="aura-bracket-mark"></span>
          <span className="aura-bracket-stem"></span>
          <span className="aura-bracket-dot"></span>
          <p className="aura-bracket-label">Custos operacionais</p>
        </div>
      </div>
      <p className="aura-note">Agrupamento conforme o documento original.</p>
    </AuraSlide>
  )
}

/* ── Fontes de receita ────────────────────────────────────────────────── */
const REVENUE = [
  { text: 'Venda da licença de uso da solução', tag: 'Capital de giro', wide: false },
  { text: 'Suporte → assinatura mensal', tag: 'Capital de giro', wide: false },
  {
    text: 'Dados de sell-out agregados e anonimizados, com opt-in da farmácia (LGPD)',
    tag: 'Lucro',
    wide: true
  }
]

function AuraRevenue() {
  return (
    <AuraSlide kicker="Solução · product proposal" title="Fontes de receita" className="aura-revenue">
      <div className="aura-revenue-list">
        {REVENUE.map((r, i) => (
          <div
            className={`aura-revenue-row ${r.wide ? 'aura-revenue-row--wide' : ''}`}
            key={r.text}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="aura-revenue-index">0{i + 1}</span>
            <p className="aura-revenue-text">{r.text}</p>
            <span className="aura-revenue-arrow"><i className="bi bi-arrow-right"></i></span>
            <span className={`aura-tag aura-tag--accent ${r.tag === 'Lucro' ? 'aura-tag--light' : ''}`}>
              {r.tag}
            </span>
          </div>
        ))}
      </div>
      <p className="aura-note">Mapeamento de retorno conforme apresentado no documento original.</p>
    </AuraSlide>
  )
}

/* ── Comparativo de mercado ───────────────────────────────────────────── */
const COMPETITORS = [
  {
    empresa: 'OFarma',
    foco: 'ERP + PDV + SNGPC',
    porte: 'Todos os portes (manipulção)',
    destaque: 'Suporte contínuo 24/7 + compras integradas com cotação online',
    modelo: 'ERP Cloud (SaaS)'
  },
  {
    empresa: 'Linx Big Farma',
    foco: 'ERP + PDV + PBM + NF',
    porte: 'Médias e grandes redes e megastores',
    destaque: 'Integração com PBMs + gestão tributaria',
    modelo: 'ERP Híbrido / Cloud Omnichannel / On-premise'
  },
  {
    empresa: 'Trier Drogarias',
    foco: 'ERP + SNGPC + NF',
    porte: 'Pequenas à grandes redes farmacêuticas',
    destaque: 'Ferramenta BI + API Sistema nativo + mobilidade',
    modelo: 'ERP (SaaS) + aplicações PDV móveis nativas'
  },
  {
    empresa: 'AuraFarma',
    foco: 'ERP + PDV + SNGPC + NF',
    porte: 'Pequenas e médias farmácias',
    destaque: 'Ferramenta BI + mobilidade + relatório IA + gestão',
    modelo: 'ERP + mobilidade',
    highlight: true
  }
]

function AuraCompetition() {
  return (
    <AuraSlide kicker="Solução · posicionamento" title="Comparativo de mercado" className="aura-competition">
      <div className="aura-table-wrap">
        <table className="aura-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Foco Principal</th>
              <th>Porte ideal</th>
              <th>Destaque</th>
              <th>Modelo</th>
            </tr>
          </thead>
          <tbody>
            {COMPETITORS.map((c) => (
              <tr key={c.empresa} className={c.highlight ? 'is-highlight' : ''}>
                <td><span className="aura-company">{c.empresa}</span></td>
                <td>{c.foco}</td>
                <td>{c.porte}</td>
                <td>{c.destaque}</td>
                <td>{c.modelo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuraSlide>
  )
}

/* ── MVP: telas ───────────────────────────────────────────────────────── */
function AuraMvpSlide({ kicker, title, lead, items, image, alt, imageClass = '' }) {
  return (
    <AuraSlide kicker={kicker} title={title} className="aura-mvp">
      <div className="aura-mvp-grid">
        <div className="aura-mvp-text">
          <p className="aura-lead aura-lead--tight">{lead}</p>
          <ul className="aura-list aura-list--compact">
            {items.map((item) => (
              <li key={item}><i className="bi bi-check-lg"></i>{item}</li>
            ))}
          </ul>
        </div>
        <figure className={`aura-shot ${imageClass}`}>
          <img src={image} alt={alt} />
        </figure>
      </div>
    </AuraSlide>
  )
}

function AuraEstoque() {
  return (
    <AuraMvpSlide
      kicker="Solução · MVP da aplicação"
      title="Gestão de estoque"
      lead="Controle dos medicamentos e das quantidades disponíveis na farmácia."
      items={[
        '20 medicamentos no estoque, com categoria, preço e quantidade',
        'Busca por nome, código ou princípio ativo e filtro por categoria',
        'Mínimo configurado por produto, com alerta visual de estoque baixo',
        'Cadastro de novos medicamentos na própria tela'
      ]}
      image={mvpEstoque}
      alt="Tela de gestão de estoque do MVP AuraFarma"
    />
  )
}

function AuraPdv() {
  return (
    <AuraMvpSlide
      kicker="Solução · MVP da aplicação"
      title="Integração PDV"
      lead="Registro da venda no ponto de venda, com baixa automática do estoque."
      items={[
        'Adição de produtos por código de barras ou por clique',
        'Carrinho com itens, subtotal e total da venda',
        'Formas de pagamento: PIX, Cartão e Dinheiro',
        'Ao finalizar, o estoque é descontado automaticamente',
        'Itens com poucas unidades sinalizados como restantes'
      ]}
      image={mvpPdv}
      alt="Tela de nova venda do MVP AuraFarma"
    />
  )
}

function AuraPedidos() {
  return (
    <AuraMvpSlide
      kicker="Solução · MVP da aplicação"
      title="Central de pedidos"
      lead="Reposição de estoque junto ao distribuidor Eurofarma, do pedido ao recebimento."
      items={[
        'Sugestão de reposição com os produtos abaixo do estoque mínimo',
        'Quantidade a pedir ajustável item a item',
        'Pedido enviado ao distribuidor e acompanhado como “Em andamento”',
        'O estoque entra quando o pedido é recebido',
        'Total do pedido calculado na confirmação'
      ]}
      image={mvpPedidos}
      alt="Tela de pedidos de reposição do MVP AuraFarma"
    />
  )
}

function AuraDashboard() {
  return (
    <AuraMvpSlide
      kicker="Diferencial · MVP da aplicação"
      title="Dashboard adaptado com IA (BI)"
      lead="Visão geral do dia com um resumo escrito pela IA a partir dos dados da farmácia."
      items={[
        'Resumo do dia gerado por IA, com receita, margem e ritmo das vendas',
        'Indicadores de receita, lucro estimado, itens vendidos e ticket médio',
        'Receita ao longo do tempo com visões dia, semana, mês e ano',
        'Alertas de reposição e produtos campeões citados na análise',
        'Análise pode ser regenerada a qualquer momento'
      ]}
      image={mvpDashboard}
      alt="Dashboard com resumo gerado por IA do MVP AuraFarma"
    />
  )
}

function AuraRelatorios() {
  return (
    <AuraMvpSlide
      kicker="Diferencial · MVP da aplicação"
      title="Relatório automatizado com IA"
      lead="Resumos gerados por IA e métricas do período selecionado."
      items={[
        'Análise semanal escrita pela IA, com leitura de estoque e de vendas',
        'Métricas de receita, custo das vendas, lucro estimado e itens vendidos',
        'Filtros de período: hoje, semana e mês',
        'Gráfico de receita dos últimos 7 dias'
      ]}
      image={mvpRelatorios}
      alt="Tela de relatórios com análise gerada por IA do MVP AuraFarma"
    />
  )
}

/* ── MVP publicado ────────────────────────────────────────────────────── */
function AuraLive() {
  return (
    <AuraSlide kicker="Solução · MVP da aplicação" title="MVP no ar" className="aura-live">
      <div className="aura-live-panel">
        <i className="bi bi-globe2 aura-live-icon"></i>
        <p className="aura-live-text">Aplicação publicada e disponível para acesso:</p>
        <a
          className="aura-live-link"
          href="https://aura-farma.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          https://aura-farma.vercel.app/
        </a>
        <div className="aura-tags aura-tags--center">
          <span className="aura-tag">Gestão de estoque</span>
          <span className="aura-tag">Integração PDV</span>
          <span className="aura-tag">Central de pedidos</span>
          <span className="aura-tag aura-tag--accent">IA aplicada</span>
        </div>
      </div>
    </AuraSlide>
  )
}

/* ── A sigla ──────────────────────────────────────────────────────────── */
const ACRONYM = [
  { letter: 'A', word: 'dministração' },
  { letter: 'U', word: 'nificada' },
  { letter: 'R', word: 'eservada' },
  { letter: 'À', word: 'Pequenas' }
]

function AuraAcronym() {
  return (
    <div className="slide aura-slide aura-acronym">
      <img src={AURA_LOGO} alt={AURA_LOGO_ALT} className="aura-logo aura-acronym-logo" />
      <p className="aura-kicker">A sigla</p>
      <div className="aura-acronym-grid">
        <div className="aura-acronym-list">
          {ACRONYM.map((a, i) => (
            <div className="aura-acronym-row" key={a.letter} style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="aura-acronym-letter">{a.letter}</span>
              <span className="aura-acronym-word">{a.word}</span>
            </div>
          ))}
        </div>
        <div className="aura-acronym-wordmark">
          <span className="aura-acronym-f">F</span>ARMÁCIAS
        </div>
      </div>
    </div>
  )
}

/* ── Fechamento ───────────────────────────────────────────────────────── */
function AuraClosing() {
  return (
    <div className="slide slide-intro aura-closing">
      <div className="logo-section">
        <img src={AURA_LOGO} alt={AURA_LOGO_ALT} className="logo-img" />
      </div>
    </div>
  )
}

export const AURA_SLIDES = [
  AuraIntro,
  AuraClients,
  AuraPains,
  AuraValue,
  AuraPlatform,
  AuraOperation,
  AuraRevenue,
  AuraCompetition,
  AuraEstoque,
  AuraPdv,
  AuraPedidos,
  AuraDashboard,
  AuraRelatorios,
  AuraLive,
  AuraAcronym,
  AuraClosing
]
