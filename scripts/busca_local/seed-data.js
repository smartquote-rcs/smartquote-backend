require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Dados de teste para fornecedores
const fornecedoresData = [
  {
    id: 1,
    nome_empresa: "TechSolutions Lda",
    observacoes: "Fornecedor especializado em equipamentos de informática e soluções tecnológicas",
    ativo: true,
    cadastrado_em: "2024-01-15",
    cadastrado_por: 1,
    atualizado_em: "2024-01-15",
    atualizado_por: 1,
    categoria_mercado: "tecnologia",
    contactos: {
      email: "comercial@techsolutions.pt",
      telefone: "+351 21 123 4567",
      website: "www.techsolutions.pt",
      morada: "Rua da Tecnologia, 123, Lisboa"
    },
    rating: 4.5,
    localizacao: "Lisboa, Portugal"
  },
  {
    id: 2,
    nome_empresa: "MaterialPro SA",
    observacoes: "Fornecedor de materiais de construção e ferramentas industriais",
    ativo: true,
    cadastrado_em: "2024-01-20",
    cadastrado_por: 1,
    atualizado_em: "2024-02-10",
    atualizado_por: 1,
    categoria_mercado: "construção",
    contactos: {
      email: "vendas@materialpro.pt",
      telefone: "+351 22 987 6543",
      website: "www.materialpro.pt",
      morada: "Av. Industrial, 456, Porto"
    },
    rating: 4.2,
    localizacao: "Porto, Portugal"
  },
  {
    id: 3,
    nome_empresa: "EcoSupplies Europe",
    observacoes: "Fornecedor de produtos sustentáveis e eco-friendly para empresas",
    ativo: true,
    cadastrado_em: "2024-02-01",
    cadastrado_por: 1,
    atualizado_em: "2024-02-01",
    atualizado_por: 1,
    categoria_mercado: "sustentabilidade",
    contactos: {
      email: "info@ecosupplies.eu",
      telefone: "+351 21 555 7890",
      website: "www.ecosupplies.eu",
      morada: "Parque Empresarial, Lote 78, Cascais"
    },
    rating: 4.8,
    localizacao: "Cascais, Portugal"
  },
  {
    id: 4,
    nome_empresa: "OfficeMax Portugal",
    observacoes: "Distribuidor de material de escritório e mobiliário corporativo",
    ativo: true,
    cadastrado_em: "2024-01-10",
    cadastrado_por: 1,
    atualizado_em: "2024-03-05",
    atualizado_por: 1,
    categoria_mercado: "escritório",
    contactos: {
      email: "corporate@officemax.pt",
      telefone: "+351 21 333 4444",
      website: "www.officemax.pt",
      morada: "Centro Comercial Escritórios, Lojas 12-15, Sintra"
    },
    rating: 4.0,
    localizacao: "Sintra, Portugal"
  },
  {
    id: 5,
    nome_empresa: "Digital Media Hub",
    observacoes: "Fornecedor de equipamentos audiovisuais e soluções multimédia",
    ativo: true,
    cadastrado_em: "2024-02-15",
    cadastrado_por: 1,
    atualizado_em: "2024-02-15",
    atualizado_por: 1,
    categoria_mercado: "multimédia",
    contactos: {
      email: "sales@digitalmediahub.pt",
      telefone: "+351 21 777 8888",
      website: "www.digitalmediahub.pt",
      morada: "Rua dos Media, 99, Oeiras"
    },
    rating: 4.3,
    localizacao: "Oeiras, Portugal"
  }
];

async function seedfornecedores() {
  console.log('🏭 Inserindo fornecedores...');
  
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert(fornecedoresData)
      .select('*');

    if (error) {
      console.error('❌ Erro ao inserir fornecedores:', error.message);
      return null;
    }

    console.log(` ${data.length} fornecedores inseridos com sucesso!`);
    return data;
  } catch (err) {
    console.error('❌ Erro geral ao inserir fornecedores:', err.message);
    return null;
  }
}

async function seedProdutos() {
  console.log('📦 Inserindo produtos...');

  const produtosData = [
    {
        
      id: 1,
      nome: "Laptop Dell Inspiron 15",
      preco: 75999, // 759.99 em centavos
      estoque: 25,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1, // TechSolutions
      codigo_sku: "DELL-INS15-001",
      tags: ["laptop", "dell", "escritório"],
      descricao_geral: "Laptop para uso profissional com 8GB RAM e SSD 256GB",
      categoria_geral: "informática",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        processador: "Intel Core i5-12400",
        memoria: "8GB DDR4",
        armazenamento: "256GB SSD",
        tela: "15.6\" Full HD",
        garantia: "2 anos"
      },
      dias_de_entrega: 3,
      data_cadastro: "2024-08-10T10:00:00",
      status: true
    },
    {
      id: 2,
      nome: "Monitor Samsung 24\" 4K",
      preco: 32999, // 329.99
      estoque: 15,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1, // TechSolutions
      codigo_sku: "SAM-MON24-4K",
      tags: ["monitor", "samsung", "4k"],
      descricao_geral: "Monitor profissional 4K com tecnologia HDR",
      categoria_geral: "periféricos",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        resolucao: "3840x2160",
        tecnologia: "IPS",
        conectividade: "HDMI, DisplayPort, USB-C",
        ajuste: "altura e inclinação"
      },
      dias_de_entrega: 2,
      data_cadastro: "2024-08-10T10:30:00",
      status: true
    },

    // Produtos MaterialPro (fornecedor 2)
    {
      id: 3,
      nome: "Furadeira Bosch Professional",
      preco: 18999, // 189.99
      estoque: 8,
      atualizado_em: "2024-08-10",
      fornecedor_id: 2, // MaterialPro
      codigo_sku: "BOSCH-FUR-PRO",
      tags: ["ferramenta", "bosch", "construção"],
      descricao_geral: "Furadeira de impacto profissional com bateria",
      categoria_geral: "ferramentas",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        potencia: "18V",
        bateria: "Lithium 2.0Ah",
        velocidade: "0-2000 rpm",
        peso: "1.2kg"
      },
      dias_de_entrega: 5,
      data_cadastro: "2024-08-10T11:00:00",
      status: true
    },
    {
      id: 4,
      nome: "Cimento Portland 25kg",
      preco: 899, // 8.99
      estoque: 200,
      atualizado_em: "2024-08-10",
      fornecedor_id: 2, // MaterialPro
      codigo_sku: "CIM-PORT-25KG",
      tags: ["cimento", "construção", "material"],
      descricao_geral: "Cimento Portland tipo II para uso geral",
      categoria_geral: "materiais_construção",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        peso: "25kg",
        tipo: "Portland II",
        resistencia: "32.5N",
        aplicacao: "uso geral"
      },
      dias_de_entrega: 1,
      data_cadastro: "2024-08-10T11:30:00",
      status: true
    },

    // Produtos EcoSupplies (fornecedor 3)
    {
      id: 5,
      nome: "Papel Reciclado A4 500fls",
      preco: 599, // 5.99
      estoque: 150,
      atualizado_em: "2024-08-10",
      fornecedor_id: 3, // EcoSupplies
      codigo_sku: "ECO-PAP-A4-500",
      tags: ["papel", "reciclado", "escritório", "eco"],
      descricao_geral: "Papel 100% reciclado certificado FSC",
      categoria_geral: "papelaria_eco",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        gramatura: "80g/m²",
        brancura: "CIE 120",
        certificacao: "FSC Recycled",
        origem: "fibras recicladas"
      },
      dias_de_entrega: 2,
      data_cadastro: "2024-08-10T12:00:00",
      status: true
    },

    // Produtos OfficeMax (fornecedor 4)
    {
      id: 6,
      nome: "Cadeira Ergonómica Office Pro",
      preco: 24999, // 249.99
      estoque: 12,
      atualizado_em: "2024-08-10",
      fornecedor_id: 4, // OfficeMax
      codigo_sku: "OFF-CAD-ERGO",
      tags: ["cadeira", "ergonómica", "escritório"],
      descricao_geral: "Cadeira ergonómica com apoio lombar ajustável",
      categoria_geral: "mobiliário",
      disponibilidade: "por encomenda",
      especificacoes_tecnicas: {
        material: "tecido respirável",
        ajustes: "altura, braços, lombar",
        rodas: "silenciosas",
        peso_max: "120kg"
      },
      dias_de_entrega: 7,
      data_cadastro: "2024-08-10T12:30:00",
      status: true
    },

    // Produtos Digital Media Hub (fornecedor 5)
    {
      id: 7,
      nome: "Projetor 4K Epson",
      preco: 159999, // 1599.99
      estoque: 5,
      atualizado_em: "2024-08-10",
      fornecedor_id: 5, // Digital Media Hub
      codigo_sku: "EPSON-PROJ-4K",
      tags: ["projetor", "4k", "apresentações"],
      descricao_geral: "Projetor 4K para apresentações profissionais",
      categoria_geral: "audiovisual",
      disponibilidade: "limitada",
      especificacoes_tecnicas: {
        resolucao: "4096x2160",
        luminosidade: "3000 lumens",
        conectividade: "HDMI, WiFi, USB",
        vida_util_lampada: "20000h"
      },
      dias_de_entrega: 10,
      data_cadastro: "2024-08-10T13:00:00",
      status: true
    },
    {
      id: 8,
      nome: "Servidor Rack 2U Enterprise",
      preco: 489999,
      estoque: 6,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "SRV-RACK2U-ENT",
      tags: ["hardware", "servidor", "datacenter"],
      descricao_geral: "Servidor 2U com redundância de fonte e RAID para workloads críticos.",
      categoria_geral: "it_hardware",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        cpu: "2x Intel Xeon Silver",
        memoria: "128GB ECC",
        armazenamento: "8x 2TB SAS (RAID 10)",
        rede: "4x10GbE",
        redundancia: true
      },
      dias_de_entrega: 5,
      data_cadastro: "2024-08-10T13:30:00",
      status: true
    },
    {
      id: 9,
      nome: "Terminal Automação de Posto POS-X",
      preco: 129999,
      estoque: 20,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "AUTO-POSTO-POSX",
      tags: ["automacao", "posto", "pos"],
      descricao_geral: "Terminal integrado para automação de postos de combustível com NFC e QR.",
      categoria_geral: "automacao_postos",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        cpu: "ARM Quad-Core",
        memoria: "4GB",
        display: "10.1'' touch",
        conectividade: "Ethernet, WiFi, NFC, USB",
        certificacoes: ["EMV", "PCI"],
        sistema: "Linux Embedded"
      },
      dias_de_entrega: 4,
      data_cadastro: "2024-08-10T13:40:00",
      status: true
    },
    {
      id: 10,
      nome: "Licença Plataforma ERP Cloud (anual)",
      preco: 99999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "SW-ERP-CLOUD-ANUAL",
      tags: ["software", "erp", "cloud"],
      descricao_geral: "Subscrição anual de módulo ERP multi-tenant com API REST/GraphQL.",
      categoria_geral: "software",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        modulos: ["financeiro", "compras", "estoque"],
        api: true,
        sla: "99.9%",
        suporte: "8x5"
      },
      dias_de_entrega: 0,
      data_cadastro: "2024-08-10T13:50:00",
      status: true
    },
    {
      id: 11,
      nome: "Cluster Kubernetes Gerido (mensal)",
      preco: 45999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "CLOUD-K8S-MENSAL",
      tags: ["cloud", "kubernetes", "devops"],
      descricao_geral: "Provisionamento e gestão de cluster Kubernetes com monitorização e backups.",
      categoria_geral: "cloud",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        nodes_iniciais: 3,
        autoscaling: true,
        monitoring: "Prometheus+Grafana",
        backup: "Diário"
      },
      dias_de_entrega: 1,
      data_cadastro: "2024-08-10T14:00:00",
      status: true
    },
    {
      id: 12,
      nome: "Pacote Cibersegurança MDR (mensal)",
      preco: 29999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "CYBER-MDR-BASE",
      tags: ["ciberseguranca", "mdr", "seguranca"],
      descricao_geral: "Serviço de Detecção e Resposta Gerida com SOC 24/7.",
      categoria_geral: "ciberseguranca",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        cobertura: ["endpoint", "rede", "cloud"],
        sla_incidente: "30min",
        relatorios: "mensal"
      },
      dias_de_entrega: 2,
      data_cadastro: "2024-08-10T14:10:00",
      status: true
    },
    {
      id: 13,
      nome: "Kit Realidade Virtual Corporativo",
      preco: 224999,
      estoque: 10,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "VR-CORP-KIT",
      tags: ["vr", "treinamento", "imersivo"],
      descricao_geral: "Conjunto VR com headset, controladores e software de formação.",
      categoria_geral: "vr",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        resolucao: "4K por olho",
        tracking: "inside-out",
        garantia: "1 ano"
      },
      dias_de_entrega: 6,
      data_cadastro: "2024-08-10T14:20:00",
      status: true
    },
    {
      id: 14,
      nome: "Gateway IoT Industrial",
      preco: 55999,
      estoque: 30,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "IOT-GW-IND",
      tags: ["iot", "gateway", "industrial"],
      descricao_geral: "Gateway para recolha e transmissão segura de dados industriais.",
      categoria_geral: "iot",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        protocolos: ["Modbus", "OPC-UA", "MQTT"],
        conectividade: ["Ethernet", "4G", "WiFi"],
        edge_ai: true
      },
      dias_de_entrega: 3,
      data_cadastro: "2024-08-10T14:30:00",
      status: true
    },
    {
      id: 15,
      nome: "Plataforma Hospital Inteligente (licença)",
      preco: 349999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "HEALTH-SMART-PLAT",
      tags: ["healthtech", "hospital", "plataforma"],
      descricao_geral: "Suite para gestão integrada de fluxos hospitalares e telemetria IoT.",
      categoria_geral: "hospitais_inteligentes",
      disponibilidade: "por encomenda",
      especificacoes_tecnicas: {
        modulos: ["triagem", "telemetria", "dashboards"],
        interoperabilidade: "FHIR",
        compliance: ["GDPR", "ISO27001"]
      },
      dias_de_entrega: 14,
      data_cadastro: "2024-08-10T14:40:00",
      status: true
    },
    {
      id: 16,
      nome: "Quiosque Self-Service Touch 21\"",
      preco: 189999,
      estoque: 18,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "KIOSK-TOUCH-21",
      tags: ["quiosque", "self-service", "touch"],
      descricao_geral: "Quiosque interativo para check-in, pagamentos e consulta de informação.",
      categoria_geral: "quiosques",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        ecrã: "21.5'' touch capacitivo",
        perifericos: ["leitor QR", "impressora térmica"],
        material: "aço pintado"
      },
      dias_de_entrega: 9,
      data_cadastro: "2024-08-10T14:50:00",
      status: true
    },
    {
      id: 17,
      nome: "Pacote BI & Dashboards Avançados",
      preco: 139999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "BI-DASH-ADV",
      tags: ["bi", "analytics", "dashboards"],
      descricao_geral: "Implementação de painéis analíticos com KPIs customizados.",
      categoria_geral: "business_intelligence",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        engine: "ClickHouse",
        integracoes: ["ERP", "CRM"],
        export: ["PDF", "XLSX"]
      },
      dias_de_entrega: 4,
      data_cadastro: "2024-08-10T15:00:00",
      status: true
    },
    {
      id: 18,
      nome: "Suite Compliance KYC / AML",
      preco: 259999,
      estoque: 9999,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "KYC-AML-SUITE",
      tags: ["kyc", "aml", "compliance"],
      descricao_geral: "Ferramenta para verificação de identidade e monitorização anti-lavagem.",
      categoria_geral: "kyc_aml",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        verificacoes: ["documento", "face match", "listas sancao"],
        api: true,
        retention_policy: "180 dias"
      },
      dias_de_entrega: 6,
      data_cadastro: "2024-08-10T15:10:00",
      status: true
    },
    {
      id: 19,
      nome: "Sistema CCTV 16 Câmeras IP",
      preco: 299999,
      estoque: 7,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "CCTV-16-IP-KIT",
      tags: ["cctv", "seguranca", "video"],
      descricao_geral: "Kit completo com NVR, 16 câmeras IP PoE e armazenamento 30 dias.",
      categoria_geral: "cctv",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        cameras: 16,
        armazenamento: "20TB RAID5",
        resolucao: "4MP",
        analytics: ["detecção movimento", "linha virtual"]
      },
      dias_de_entrega: 8,
      data_cadastro: "2024-08-10T15:20:00",
      status: true
    },
    {
      id: 20,
      nome: "Controlador de Acesso Biométrico",
      preco: 45999,
      estoque: 40,
      atualizado_em: "2024-08-10",
      fornecedor_id: 1,
      codigo_sku: "CTRL-ACESSO-BIO",
      tags: ["acesso", "biometria", "seguranca"],
      descricao_geral: "Terminal biométrico com suporte RFID e detecção de falsificação.",
      categoria_geral: "controle_acesso",
      disponibilidade: "imediata",
      especificacoes_tecnicas: {
        biometria: ["impressao_digital", "facial"],
        conexoes: ["TCP/IP", "RS485"],
        capacidade_usuarios: 10000
      },
      dias_de_entrega: 5,
      data_cadastro: "2024-08-10T15:30:00",
      status: true
    },
    {
id: 21,
nome: "Monitor Profissional 27 4K",
preco: 149999,
estoque: 25,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "MON-27-4K-PRO",
tags: ["monitor", "display", "profissional"],
descricao_geral: "Monitor 27 polegadas com resolução 4K e calibração de cores para designers.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
resolucao: "3840x2160",
painel: "IPS",
taxa_atualizacao: "60Hz",
conexoes: ["HDMI", "DisplayPort", "USB-C"]
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T15:40:00",
status: true
},
{
id: 22,
nome: "Teclado Mecânico RGB",
preco: 59999,
estoque: 50,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "KBD-MEC-RGB",
tags: ["teclado", "mecanico", "gaming"],
descricao_geral: "Teclado mecânico com switches Cherry MX e iluminação RGB personalizável.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
switches: "Cherry MX Red",
layout: "ABNT2",
conexao: "USB",
anti_ghosting: true
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T15:50:00",
status: true
},
{
id: 23,
nome: "Mouse Óptico Ergonômico",
preco: 29999,
estoque: 60,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "MOUSE-OPT-ERG",
tags: ["mouse", "ergonomico", "escritorio"],
descricao_geral: "Mouse óptico com design ergonômico para uso prolongado e sensor de alta precisão.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
dpi: "16000",
botoes: 6,
conexao: "Wireless",
bateria: "Recarregável"
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T16:00:00",
status: true
},
{
id: 24,
nome: "Impressora Laser Multifuncional",
preco: 199999,
estoque: 15,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "IMP-LASER-MULTI",
tags: ["impressora", "laser", "multifuncional"],
descricao_geral: "Impressora laser com funções de impressão, cópia, digitalização e fax.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
velocidade: "30ppm",
resolucao: "1200x1200dpi",
conectividade: ["USB", "Ethernet", "WiFi"],
duplex: true
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T16:10:00",
status: true
},
{
id: 25,
nome: "HD Externo 4TB USB 3.0",
preco: 79999,
estoque: 40,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "HD-EXT-4TB",
tags: ["armazenamento", "hd_externo", "backup"],
descricao_geral: "Disco rígido externo de 4TB com criptografia e compatibilidade multiplataforma.",
categoria_geral: "armazenamento",
disponibilidade: "imediata",
especificacoes_tecnicas: {
capacidade: "4TB",
interface: "USB 3.0",
velocidade: "5400RPM",
criptografia: "AES-256"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T16:20:00",
status: true
},
{
id: 26,
nome: "SSD NVMe 1TB",
preco: 89999,
estoque: 35,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SSD-NVME-1TB",
tags: ["armazenamento", "ssd", "nvme"],
descricao_geral: "SSD NVMe de alta velocidade para upgrades de performance em PCs e laptops.",
categoria_geral: "armazenamento",
disponibilidade: "imediata",
especificacoes_tecnicas: {
capacidade: "1TB",
leitura: "3500MB/s",
escrita: "3000MB/s",
form_factor: "M.2 2280"
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T16:30:00",
status: true
},
{
id: 27,
nome: "NAS 4 Bay para Home Office",
preco: 249999,
estoque: 10,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "NAS-4BAY-HO",
tags: ["armazenamento", "nas", "rede"],
descricao_geral: "Servidor NAS com 4 baias para backup e streaming em redes domésticas.",
categoria_geral: "armazenamento",
disponibilidade: "imediata",
especificacoes_tecnicas: {
baias: 4,
cpu: "Quad-Core",
memoria: "4GB",
apps: ["Plex", "Backup"]
},
dias_de_entrega: 6,
data_cadastro: "2024-08-10T16:40:00",
status: true
},
{
id: 28,
nome: "Router WiFi Mesh Dual Band",
preco: 129999,
estoque: 20,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "ROUTER-MESH-DB",
tags: ["rede", "router", "mesh"],
descricao_geral: "Sistema mesh para cobertura WiFi em áreas amplas com gerenciamento app.",
categoria_geral: "rede",
disponibilidade: "imediata",
especificacoes_tecnicas: {
bandas: ["2.4GHz", "5GHz"],
cobertura: "300m²",
portas: "2x Gigabit",
seguranca: "WPA3"
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T16:50:00",
status: true
},
{
id: 29,
nome: "Câmera IP Interna HD",
preco: 39999,
estoque: 45,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "CAM-IP-INT-HD",
tags: ["seguranca", "camera", "ip"],
descricao_geral: "Câmera IP para monitoramento interno com visão noturna e detecção de movimento.",
categoria_geral: "seguranca",
disponibilidade: "imediata",
especificacoes_tecnicas: {
resolucao: "1080p",
angulo: "120°",
conectividade: "WiFi",
armazenamento: "MicroSD"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T17:00:00",
status: true
},
{
id: 30,
nome: "Alarme Inteligente Residencial",
preco: 159999,
estoque: 18,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "ALARM-INT-RES",
tags: ["seguranca", "alarme", "smart_home"],
descricao_geral: "Kit de alarme com sensores e integração com assistentes virtuais.",
categoria_geral: "seguranca",
disponibilidade: "imediata",
especificacoes_tecnicas: {
sensores: ["porta", "movimento", "sirene"],
protocolo: "Zigbee",
app: true,
bateria_backup: true
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T17:10:00",
status: true
},
{
id: 31,
nome: "Licença Antivirus Corporativo (anual)",
preco: 49999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SW-AV-CORP-ANUAL",
tags: ["software", "antivirus", "seguranca"],
descricao_geral: "Proteção antivírus com detecção em tempo real e gerenciamento centralizado.",
categoria_geral: "software",
disponibilidade: "imediata",
especificacoes_tecnicas: {
dispositivos: "ilimitado",
features: ["firewall", "anti-ransomware"],
atualizacoes: "diárias",
suporte: "24/7"
},
dias_de_entrega: 0,
data_cadastro: "2024-08-10T17:20:00",
status: true
},
{
id: 32,
nome: "Plataforma E-learning Corporativa",
preco: 299999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SW-ELEARN-CORP",
tags: ["software", "elearning", "treinamento"],
descricao_geral: "Plataforma para cursos online com certificação e relatórios de progresso.",
categoria_geral: "software",
disponibilidade: "imediata",
especificacoes_tecnicas: {
modulos: ["cursos", "avaliacoes", "gamificacao"],
integracoes: ["LMS", "HR"],
usuarios: "ilimitado",
hosting: "cloud"
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T17:30:00",
status: true
},
{
id: 33,
nome: "Drone Profissional para Inspeção",
preco: 499999,
estoque: 5,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "DRONE-PRO-INSP",
tags: ["drone", "inspecao", "industrial"],
descricao_geral: "Drone com câmera 4K e sensores para inspeções aéreas em indústrias.",
categoria_geral: "drones",
disponibilidade: "por encomenda",
especificacoes_tecnicas: {
autonomia: "30min",
camera: "4K 60fps",
alcance: "5km",
resistencia: "IP54"
},
dias_de_entrega: 10,
data_cadastro: "2024-08-10T17:40:00",
status: true
},
{
id: 34,
nome: "Tablet Robusto Industrial 10",
preco: 189999,
estoque: 12,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "TAB-ROB-IND-10",
tags: ["tablet", "robusto", "industrial"],
descricao_geral: "Tablet resistente a choques e poeira para uso em ambientes industriais.",
categoria_geral: "dispositivos_moveis",
disponibilidade: "imediata",
especificacoes_tecnicas: {
tela: "10.1'' Gorilla Glass",
cpu: "Octa-Core",
memoria: "8GB",
certificacoes: ["IP68", "MIL-STD-810"]
},
dias_de_entrega: 7,
data_cadastro: "2024-08-10T17:50:00",
status: true
},
{
id: 35,
nome: "Smartwatch Corporativo",
preco: 99999,
estoque: 30,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SMARTW-CORP",
tags: ["wearable", "smartwatch", "saude"],
descricao_geral: "Relógio inteligente com monitoramento de saúde e integração com apps corporativos.",
categoria_geral: "wearables",
disponibilidade: "imediata",
especificacoes_tecnicas: {
display: "AMOLED 1.4''",
sensores: ["heart rate", "GPS"],
bateria: "5 dias",
compatibilidade: "iOS/Android"
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T18:00:00",
status: true
},
{
id: 36,
nome: "Pacote DevOps CI/CD (mensal)",
preco: 79999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "DEVOPS-CICD-MENSAL",
tags: ["devops", "ci_cd", "cloud"],
descricao_geral: "Ferramentas para integração contínua e deployment com pipelines automatizados.",
categoria_geral: "devops",
disponibilidade: "imediata",
especificacoes_tecnicas: {
integracoes: ["GitHub", "Jenkins"],
builds: "ilimitado",
sla: "99.99%",
suporte: "24/7"
},
dias_de_entrega: 1,
data_cadastro: "2024-08-10T18:10:00",
status: true
},
{
id: 37,
nome: "Solução Big Data Analytics",
preco: 399999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "BIGDATA-ANALYTICS",
tags: ["bigdata", "analytics", "dados"],
descricao_geral: "Plataforma para processamento e análise de grandes volumes de dados.",
categoria_geral: "big_data",
disponibilidade: "imediata",
especificacoes_tecnicas: {
engine: "Spark",
armazenamento: "escalável",
visualizacao: "Tableau-like",
seguranca: "RBAC"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T18:20:00",
status: true
},
{
id: 38,
nome: "Kit Robótica Educacional",
preco: 129999,
estoque: 20,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "ROBOT-EDU-KIT",
tags: ["robotica", "educacional", "stem"],
descricao_geral: "Kit para aprendizado de robótica com componentes programáveis.",
categoria_geral: "educacao",
disponibilidade: "imediata",
especificacoes_tecnicas: {
componentes: ["sensores", "motores", "placa"],
linguagem: "Python/Blockly",
idade: "8+",
projetos: 10
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T18:30:00",
status: true
},
{
id: 39,
nome: "Impressora 3D Desktop",
preco: 219999,
estoque: 8,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "IMP-3D-DESK",
tags: ["impressora_3d", "prototipagem", "maker"],
descricao_geral: "Impressora 3D para prototipagem rápida com filamento PLA/ABS.",
categoria_geral: "prototipagem",
disponibilidade: "imediata",
especificacoes_tecnicas: {
volume: "220x220x250mm",
precisao: "0.1mm",
velocidade: "100mm/s",
software: "Cura"
},
dias_de_entrega: 6,
data_cadastro: "2024-08-10T18:40:00",
status: true
},
{
id: 40,
nome: "Óculos AR para Treinamento",
preco: 349999,
estoque: 6,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "AR-GLASSES-TRAIN",
tags: ["ar", "oculos", "treinamento"],
descricao_geral: "Óculos de realidade aumentada para simulações e treinamentos industriais.",
categoria_geral: "ar",
disponibilidade: "por encomenda",
especificacoes_tecnicas: {
display: "Holográfico",
tracking: "SLAM",
bateria: "4h",
sdk: true
},
dias_de_entrega: 12,
data_cadastro: "2024-08-10T18:50:00",
status: true
},
{
id: 41,
nome: "Sensor IoT Ambiental",
preco: 24999,
estoque: 50,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SENSOR-IOT-AMB",
tags: ["iot", "sensor", "ambiental"],
descricao_geral: "Sensor para monitoramento de temperatura, umidade e qualidade do ar.",
categoria_geral: "iot",
disponibilidade: "imediata",
especificacoes_tecnicas: {
parametros: ["temp", "umidade", "CO2"],
conectividade: "LoRaWAN",
bateria: "2 anos",
precisao: "+-0.5°C"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T19:00:00",
status: true
},
{
id: 42,
nome: "Plataforma Chatbot AI (mensal)",
preco: 59999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "CHATBOT-AI-MENSAL",
tags: ["ai", "chatbot", "atendimento"],
descricao_geral: "Plataforma para criação de chatbots inteligentes com NLP.",
categoria_geral: "ai",
disponibilidade: "imediata",
especificacoes_tecnicas: {
integracoes: ["WhatsApp", "Facebook"],
linguas: "multi",
analytics: true,
escalonamento: "auto"
},
dias_de_entrega: 1,
data_cadastro: "2024-08-10T19:10:00",
status: true
},
{
id: 43,
nome: "Máquina de Café Inteligente",
preco: 179999,
estoque: 15,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "COFFEE-SMART",
tags: ["smart_home", "cafe", "iot"],
descricao_geral: "Máquina de café conectada com app para programação e receitas personalizadas.",
categoria_geral: "smart_home",
disponibilidade: "imediata",
especificacoes_tecnicas: {
capacidade: "1.5L",
conectividade: "WiFi",
receitas: 20,
limpeza: "auto"
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T19:20:00",
status: true
},
{
id: 44,
nome: "Projetor Laser 4K",
preco: 299999,
estoque: 10,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "PROJ-LASER-4K",
tags: ["projetor", "laser", "apresentacao"],
descricao_geral: "Projetor laser com resolução 4K para salas de reunião e home theater.",
categoria_geral: "audiovisual",
disponibilidade: "imediata",
especificacoes_tecnicas: {
brilho: "5000 lumens",
contraste: "300000:1",
conexoes: ["HDMI", "USB"],
vida_util: "20000h"
},
dias_de_entrega: 7,
data_cadastro: "2024-08-10T19:30:00",
status: true
},
{
id: 45,
nome: "Sistema de Som Surround 5.1",
preco: 149999,
estoque: 20,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SOUND-SUR-5.1",
tags: ["audio", "surround", "home_theater"],
descricao_geral: "Sistema de som 5.1 canais com subwoofer para experiência imersiva.",
categoria_geral: "audiovisual",
disponibilidade: "imediata",
especificacoes_tecnicas: {
potencia: "1000W",
conectividade: "Bluetooth",
formatos: ["Dolby", "DTS"],
controle: "app"
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T19:40:00",
status: true
},
{
id: 46,
nome: "Licença CAD 3D Profissional (anual)",
preco: 199999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SW-CAD-3D-ANUAL",
tags: ["software", "cad", "design"],
descricao_geral: "Software de modelagem 3D para engenharia e design de produtos.",
categoria_geral: "software",
disponibilidade: "imediata",
especificacoes_tecnicas: {
features: ["simulacao", "renderizacao"],
compatibilidade: "Windows/Mac",
atualizacoes: "incluidas",
suporte: "online"
},
dias_de_entrega: 0,
data_cadastro: "2024-08-10T19:50:00",
status: true
},
{
id: 47,
nome: "Estabilizador de Tensão 1000VA",
preco: 49999,
estoque: 40,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "ESTAB-1000VA",
tags: ["energia", "estabilizador", "protecao"],
descricao_geral: "Estabilizador para proteção de equipamentos contra variações de tensão.",
categoria_geral: "energia",
disponibilidade: "imediata",
especificacoes_tecnicas: {
potencia: "1000VA",
saidas: 6,
protecao: ["surto", "subtensao"],
display: "LED"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T20:00:00",
status: true
},
{
id: 48,
nome: "Nobreak Senoidal 2kVA",
preco: 249999,
estoque: 12,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "NOBREAK-SEN-2KVA",
tags: ["energia", "nobreak", "backup"],
descricao_geral: "Nobreak com onda senoidal pura para servidores e equipamentos sensíveis.",
categoria_geral: "energia",
disponibilidade: "imediata",
especificacoes_tecnicas: {
autonomia: "10min",
saidas: 8,
gerenciamento: "USB",
expansivel: true
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T20:10:00",
status: true
},
{
id: 49,
nome: "Painel Solar Portátil 100W",
preco: 119999,
estoque: 25,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SOLAR-PORT-100W",
tags: ["energia", "solar", "portatil"],
descricao_geral: "Painel solar dobrável para carregamento de dispositivos em campo.",
categoria_geral: "energia_renovavel",
disponibilidade: "imediata",
especificacoes_tecnicas: {
potencia: "100W",
saidas: ["USB", "DC"],
eficiencia: "22%",
peso: "3kg"
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T20:20:00",
status: true
},
{
id: 50,
nome: "Bateria Externa Power Bank 20000mAh",
preco: 39999,
estoque: 60,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "POWERBANK-20K",
tags: ["energia", "powerbank", "portatil"],
descricao_geral: "Bateria portátil com carregamento rápido para smartphones e laptops.",
categoria_geral: "acessorios_moveis",
disponibilidade: "imediata",
especificacoes_tecnicas: {
capacidade: "20000mAh",
saidas: ["USB-A", "USB-C"],
carga_rapida: "PD 18W",
led: true
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T20:30:00",
status: true
},
{
id: 51,
nome: "Laptop Ultrabook 14 i7",
preco: 399999,
estoque: 10,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "LAP-ULTRA-14-I7",
tags: ["laptop", "ultrabook", "portatil"],
descricao_geral: "Laptop leve com processador i7 para produtividade e mobilidade.",
categoria_geral: "computadores",
disponibilidade: "imediata",
especificacoes_tecnicas: {
cpu: "Intel Core i7",
memoria: "16GB",
armazenamento: "512GB SSD",
bateria: "10h"
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T20:40:00",
status: true
},
{
id: 52,
nome: "Desktop Gamer RTX 3060",
preco: 449999,
estoque: 8,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "DESK-GAMER-3060",
tags: ["desktop", "gamer", "gaming"],
descricao_geral: "PC gamer com GPU RTX 3060 para jogos em alta resolução.",
categoria_geral: "computadores",
disponibilidade: "imediata",
especificacoes_tecnicas: {
cpu: "AMD Ryzen 5",
memoria: "32GB",
gpu: "RTX 3060",
armazenamento: "1TB SSD"
},
dias_de_entrega: 6,
data_cadastro: "2024-08-10T20:50:00",
status: true
},
{
id: 53,
nome: "Servidor Blade High Density",
preco: 599999,
estoque: 4,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SRV-BLADE-HD",
tags: ["hardware", "servidor", "blade"],
descricao_geral: "Servidor blade para data centers com alta densidade e eficiência energética.",
categoria_geral: "it_hardware",
disponibilidade: "por encomenda",
especificacoes_tecnicas: {
cpu: "2x AMD EPYC",
memoria: "256GB",
armazenamento: "4x 1TB NVMe",
rede: "2x25GbE"
},
dias_de_entrega: 15,
data_cadastro: "2024-08-10T21:00:00",
status: true
},
{
id: 54,
nome: "Switch PoE 48 Portas",
preco: 249999,
estoque: 10,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SWITCH-POE-48",
tags: ["rede", "switch", "poe"],
descricao_geral: "Switch gerenciável com PoE para alimentação de dispositivos IP.",
categoria_geral: "rede",
disponibilidade: "imediata",
especificacoes_tecnicas: {
portas: "48x1GbE PoE+",
uplink: "4x10GbE",
potencia_poe: "740W",
gerenciamento: "Web/CLI"
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T21:10:00",
status: true
},
{
id: 55,
nome: "Firewall Next-Gen Enterprise",
preco: 349999,
estoque: 6,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "FW-NG-ENT",
tags: ["seguranca", "firewall", "nextgen"],
descricao_geral: "Firewall de próxima geração com IA para detecção de ameaças avançadas.",
categoria_geral: "seguranca_rede",
disponibilidade: "imediata",
especificacoes_tecnicas: {
throughput: "10Gbps",
features: ["SSL Inspection", "Zero Trust"],
portas: "8x10GbE",
ha: true
},
dias_de_entrega: 7,
data_cadastro: "2024-08-10T21:20:00",
status: true
},
{
id: 56,
nome: "Plataforma CRM Avançada (anual)",
preco: 149999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "SW-CRM-ADV-ANUAL",
tags: ["software", "crm", "avancado"],
descricao_geral: "CRM com automação de marketing e análise preditiva.",
categoria_geral: "software",
disponibilidade: "imediata",
especificacoes_tecnicas: {
modulos: ["sales", "service", "analytics"],
integracoes: ["API", "ERP"],
usuarios: "ilimitado",
ai: true
},
dias_de_entrega: 0,
data_cadastro: "2024-08-10T21:30:00",
status: true
},
{
id: 57,
nome: "Solução Backup Híbrido",
preco: 179999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "BACKUP-HIBRIDO",
tags: ["backup", "hibrido", "cloud"],
descricao_geral: "Backup local e em nuvem com deduplicação e recuperação instantânea.",
categoria_geral: "cloud",
disponibilidade: "imediata",
especificacoes_tecnicas: {
armazenamento: "ilimitado",
criptografia: "end-to-end",
retencao: "customizável",
sla: "99.999%"
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T21:40:00",
status: true
},
{
id: 58,
nome: "Kit VR Avançado",
preco: 299999,
estoque: 9,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "VR-ADV-KIT",
tags: ["vr", "kit", "imersivo"],
descricao_geral: "Kit VR com headset de alta resolução e controladores para experiências imersivas.",
categoria_geral: "vr",
disponibilidade: "imediata",
especificacoes_tecnicas: {
resolucao: "2K por olho",
tracking: "6DoF",
plataforma: "PC/Standalone",
garantia: "2 anos"
},
dias_de_entrega: 6,
data_cadastro: "2024-08-10T21:50:00",
status: true
},
{
id: 59,
nome: "Gateway IoT Residencial",
preco: 69999,
estoque: 35,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "IOT-GW-RES",
tags: ["iot", "gateway", "residencial"],
descricao_geral: "Gateway para integração de dispositivos smart home.",
categoria_geral: "iot",
disponibilidade: "imediata",
especificacoes_tecnicas: {
protocolos: ["Zigbee", "Z-Wave", "WiFi"],
app: true,
seguranca: "TLS",
compatibilidade: "Alexa/Google"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T22:00:00",
status: true
},
{
id: 60,
nome: "Plataforma Telemedicina",
preco: 249999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "HEALTH-TELEMED",
tags: ["healthtech", "telemedicina", "plataforma"],
descricao_geral: "Plataforma para consultas virtuais com integração EHR.",
categoria_geral: "hospitais_inteligentes",
disponibilidade: "imediata",
especificacoes_tecnicas: {
features: ["videochamada", "prescricao", "relatorios"],
compliance: ["HIPAA", "GDPR"],
integracoes: ["EHR"],
escalabilidade: true
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T22:10:00",
status: true
},
{
id: 61,
nome: "Quiosque Digital 32\"",
preco: 259999,
estoque: 14,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "KIOSK-DIG-32",
tags: ["quiosque", "digital", "interativo"],
descricao_geral: "Quiosque touchscreen para publicidade e informações interativas.",
categoria_geral: "quiosques",
disponibilidade: "imediata",
especificacoes_tecnicas: {
ecrã: "32'' LED",
resolucao: "Full HD",
os: "Android",
conectividade: "Ethernet/WiFi"
},
dias_de_entrega: 8,
data_cadastro: "2024-08-10T22:20:00",
status: true
},
{
id: 62,
nome: "Ferramenta BI Self-Service",
preco: 159999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "BI-SELF-SERVICE",
tags: ["bi", "self_service", "analytics"],
descricao_geral: "Ferramenta para criação de dashboards sem necessidade de TI.",
categoria_geral: "business_intelligence",
disponibilidade: "imediata",
especificacoes_tecnicas: {
data_sources: ["SQL", "Excel", "API"],
visualizacoes: "gráficos interativos",
colaboracao: true,
mobile: true
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T22:30:00",
status: true
},
{
id: 63,
nome: "Sistema KYC Digital",
preco: 199999,
estoque: 9999,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "KYC-DIGITAL",
tags: ["kyc", "digital", "compliance"],
descricao_geral: "Sistema para verificação de identidade online com biometria.",
categoria_geral: "kyc_aml",
disponibilidade: "imediata",
especificacoes_tecnicas: {
metodos: ["documento", "selfie", "liveness"],
integracao: "API",
tempo: "<1min",
compliance: "global"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T22:40:00",
status: true
},
{
id: 64,
nome: "Kit CCTV 8 Câmeras PoE",
preco: 199999,
estoque: 12,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "CCTV-8-POE-KIT",
tags: ["cctv", "kit", "poe"],
descricao_geral: "Kit de vigilância com 8 câmeras PoE e NVR para gravação 24/7.",
categoria_geral: "cctv",
disponibilidade: "imediata",
especificacoes_tecnicas: {
cameras: 8,
resolucao: "2MP",
armazenamento: "4TB",
app: true
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T22:50:00",
status: true
},
{
id: 65,
nome: "Leitor Biométrico de Acesso",
preco: 59999,
estoque: 30,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "LEITOR-BIO-ACESSO",
tags: ["biometria", "acesso", "seguranca"],
descricao_geral: "Leitor biométrico para controle de acesso com suporte a cartões.",
categoria_geral: "controle_acesso",
disponibilidade: "imediata",
especificacoes_tecnicas: {
tipos: ["digital", "RFID"],
capacidade: 5000,
conexao: "Ethernet",
rele: true
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T23:00:00",
status: true
},
{
id: 66,
nome: "Monitor Curvo Gaming 34\"",
preco: 279999,
estoque: 15,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "MON-CURV-34-GAM",
tags: ["monitor", "curvo", "gaming"],
descricao_geral: "Monitor curvo ultrawide para jogos imersivos com alta taxa de atualização.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
resolucao: "3440x1440",
taxa: "144Hz",
painel: "VA",
freesync: true
},
dias_de_entrega: 5,
data_cadastro: "2024-08-10T23:10:00",
status: true
},
{
id: 67,
nome: "Teclado Sem Fio Ergonômico",
preco: 49999,
estoque: 40,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "KBD-WIRELESS-ERG",
tags: ["teclado", "wireless", "ergonomico"],
descricao_geral: "Teclado ergonômico sem fio para redução de fadiga em uso prolongado.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
conexao: "Bluetooth",
bateria: "recarregável",
layout: "split",
compatibilidade: "multi-device"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T23:20:00",
status: true
},
{
id: 68,
nome: "Mouse Gamer RGB 16000 DPI",
preco: 39999,
estoque: 50,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "MOUSE-GAMER-RGB",
tags: ["mouse", "gamer", "rgb"],
descricao_geral: "Mouse gamer com sensor de alta precisão e botões programáveis.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
dpi: "16000",
botoes: 8,
conexao: "USB",
software: true
},
dias_de_entrega: 2,
data_cadastro: "2024-08-10T23:30:00",
status: true
},
{
id: 69,
nome: "Impressora Jato de Tinta Colorida",
preco: 89999,
estoque: 25,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "IMP-JATO-COLOR",
tags: ["impressora", "jato_tinta", "colorida"],
descricao_geral: "Impressora jato de tinta para documentos e fotos em alta qualidade.",
categoria_geral: "perifericos",
disponibilidade: "imediata",
especificacoes_tecnicas: {
velocidade: "20ppm",
resolucao: "4800x1200dpi",
conectividade: "WiFi/USB",
tanque: true
},
dias_de_entrega: 4,
data_cadastro: "2024-08-10T23:40:00",
status: true
},
{
id: 70,
nome: "HD Externo SSD 2TB",
preco: 149999,
estoque: 20,
atualizado_em: "2024-08-10",
fornecedor_id: 1,
codigo_sku: "HD-EXT-SSD-2TB",
tags: ["armazenamento", "ssd_externo", "portatil"],
descricao_geral: "HD externo SSD de 2TB com alta velocidade e resistência a choques.",
categoria_geral: "armazenamento",
disponibilidade: "imediata",
especificacoes_tecnicas: {
capacidade: "2TB",
interface: "USB-C 3.2",
velocidade: "1050MB/s",
criptografia: "hardware"
},
dias_de_entrega: 3,
data_cadastro: "2024-08-10T23:50:00",
status: true
}
];

  try {
    const { data, error } = await supabase
      .from('produtos')
      .insert(produtosData)
      .select('*');

    if (error) {
      console.error('❌ Erro ao inserir produtos:', error.message);
      return;
    }

    console.log(`✅ ${data.length} produtos inseridos com sucesso!`);
    
    // Mostrar resumo por fornecedor
    const fornecedorNomes = {
      1: "TechSolutions Lda",
      2: "MaterialPro SA", 
      3: "EcoSupplies Europe",
      4: "OfficeMax Portugal",
      5: "Digital Media Hub"
    };

    const resumo = {};
    data.forEach(produto => {
      const nome_fornecedor = fornecedorNomes[produto.fornecedor_id] || 'Desconhecido';
      if (!resumo[nome_fornecedor]) resumo[nome_fornecedor] = 0;
      resumo[nome_fornecedor]++;
    });

    console.log('\n📊 Resumo por fornecedor:');
    Object.entries(resumo).forEach(([fornecedor, quantidade]) => {
      console.log(`  └─ ${fornecedor}: ${quantidade} produtos`);
    });

  } catch (err) {
    console.error('❌ Erro geral ao inserir produtos:', err.message);
  }
}

async function seedDatabase() {
  console.log('🌱 Iniciando seed da base de dados...');
  console.log('================================\n');

  // 1. Inserir fornecedores primeiro (devido às foreign keys)
  const fornecedores = await seedfornecedores();
  
  if (fornecedores) {
    console.log('');
    // 2. Inserir produtos usando os IDs dos fornecedores
    await seedProdutos();
  }

  console.log('\n================================');
  console.log('🎉 Seed concluído!');
  console.log('\n💡 Agora você pode testar as APIs com dados reais!');
}

// Função para limpar dados (opcional)
async function clearData() {
  console.log('🧹 Limpando dados existentes...');
  
  try {
    // Deletar produtos primeiro (devido às foreign keys)
    await supabase.from('produtos').delete().neq('id', 0);
    console.log('✅ Produtos removidos');
    
    // Depois deletar fornecedores
    await supabase.from('fornecedores').delete().neq('id', 0);
    console.log('✅ fornecedores removidos');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error.message);
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearData().then(() => {
    if (args.includes('--seed')) {
      seedDatabase();
    }
  });
} else {
  seedDatabase();
}

// Exportar funções para uso em outros scripts
module.exports = {
  seedDatabase,
  seedfornecedores,
  seedProdutos,
  clearData
};
