// Init Lucide Icons
lucide.createIcons();

// Storage Key
const STORAGE_KEY = 'ldf-checkout';

// Plans Catalog
const PLANS_CATALOG = {
  essencial: {
    id: 'essencial', name: 'Essencial', price: 41.90,
    benefits: ['Reembolso de até R$ 4.000', 'Sorteio mensal de R$ 10.000', 'Cobertura de morte acidental:R$ 20.000', 'Certificado digital imediato', 'Carência de apenas 5 dias']
  },
  conforto: {
    id: 'conforto', name: 'Conforto', price: 60.90,
    benefits: ['Reembolso de até R$ 6.000', 'Sorteio mensal de R$ 10.000', 'Cobertura de morte acidental:R$ 20.000', 'Certificado digital imediato', 'Carência de apenas 5 dias']
  },
  premium: {
    id: 'premium', name: 'Premium', price: 80.90,
    benefits: ['Reembolso de até R$ 8.000', 'Sorteio mensal de R$ 10.000', 'Cobertura de morte acidental:R$ 20.000', 'Certificado digital imediato', 'Carência de apenas 5 dias']
  },
  exclusivo: {
    id: 'exclusivo', name: 'Exclusivo', price: 99.90,
    benefits: ['Reembolso de até R$ 10.000', 'Sorteio mensal de R$ 10.000', 'Cobertura de morte acidental:R$ 20.000', 'Certificado digital imediato', 'Carência de apenas 5 dias']
  },
};

const UF_LIST = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Default State
let state = {
  step: 1,
  planId: '',
  plan: null,
  personal: { cpf: '', email: '', nomeCompleto: '', celular: '', telefone: '', sexo: '', dataNascimento: '', nomeSocial: '' },
  address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
  payment: { numeroCartao: '', titularCartao: '', expiracao: '', cvv: '' },
};

// Utils & Formatting (Masks)
function applyMask(value, pattern) {
  let i = 0; return pattern.replace(/#/g, () => value[i++] || '').replace(/.*$/, (m) => i < value.length ? m : '');
}
const maskCPF = v => {
  v = v.replace(/\D/g, ''); if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
const maskCelular = v => {
  v = v.replace(/\D/g, ''); if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};
const maskTelefone = v => {
  v = v.replace(/\D/g, ''); if (v.length > 10) v = v.slice(0, 10);
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
};
const maskDate = v => {
  v = v.replace(/\D/g, ''); if (v.length > 8) v = v.slice(0, 8);
  return v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
};
const maskCEP = v => {
  v = v.replace(/\D/g, ''); if (v.length > 8) v = v.slice(0, 8);
  return v.replace(/(\d{5})(\d)/, '$1-$2');
};
const maskCardNumber = v => {
  v = v.replace(/\D/g, ''); if (v.length > 16) v = v.slice(0, 16);
  return v.replace(/(\d{4})(?=\d)/g, '$1 ');
};
const maskExpiration = v => {
  v = v.replace(/\D/g, ''); if (v.length > 4) v = v.slice(0, 4);
  return v.replace(/(\d{2})(\d)/, '$1/$2');
};
const maskCVV = (v, max) => {
  v = v.replace(/\D/g, ''); return v.slice(0, max);
};

// Validations
const validateCPF = cpf => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11; if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11; if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};
const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateFullName = name => name.trim().split(' ').length > 1;
const validateCelular = v => v.replace(/\D/g, '').length === 11;
const luhnCheck = num => {
  let arr = (num + '').replace(/\D/g, '').split('').reverse().map(x => parseInt(x, 10));
  let lastDigit = arr.splice(0, 1)[0];
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  return (sum + lastDigit) % 10 === 0 && num.replace(/\D/g, '').length >= 13;
};
const validateDate = (date) => {
  const clean = date.replace(/\D/g, '');
  if (clean.length !== 8) return { valid: false };
  const day = parseInt(clean.substring(0, 2), 10);
  const month = parseInt(clean.substring(2, 4), 10);
  const year = parseInt(clean.substring(4, 8), 10);
  if (month < 1 || month > 12) return { valid: false };
  const maxDays = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDays) return { valid: false };
  const d = new Date(year, month - 1, day);
  return { valid: true, date: d };
};
const validateExpiration = (expiration) => {
  const clean = (expiration || '').replace(/\D/g, '');
  if (clean.length !== 4) return false;
  const m = parseInt(clean.substring(0, 2), 10);
  const y = parseInt(clean.substring(2, 4), 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;
  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  return true;
};

// DOM Functions
const dom = (id) => document.getElementById(id);
const setError = (id, msg) => { const el = dom('err-' + id); if (el) el.innerText = msg || ''; };
function saveState() {
  const toSave = { ...state, payment: { ...state.payment, cvv: '', numeroCartao: state.payment.numeroCartao ? '•••• ' + state.payment.numeroCartao.slice(-4) : '' } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const parsedPayment = { ...(parsed.payment || {}) };
      if (!parsedPayment.expiracao && parsedPayment.mesExpiracao && parsedPayment.anoExpiracao) {
        parsedPayment.expiracao = `${parsedPayment.mesExpiracao}/${String(parsedPayment.anoExpiracao).slice(-2)}`;
      }
      if (parsedPayment.expiracao) {
        const cleanExp = String(parsedPayment.expiracao).replace(/\D/g, '');
        if (cleanExp.length === 6) {
          parsedPayment.expiracao = `${cleanExp.substring(0, 2)}/${cleanExp.substring(4, 6)}`;
        }
      }
      state = { ...state, ...parsed, payment: { ...state.payment, ...parsedPayment, cvv: '' } };
    } catch (e) { }
  }
}

// Render Summary
function renderSummaryHtml(plan, isMobile) {
  return `
    <div class="space-y-4">
      <div class="plan-header">
        <div class="plan-icon-wrapper"><i data-lucide="shield" style="width:1.25rem; height:1.25rem;"></i></div>
        <div>
          <h3 class="plan-name">${plan.name}</h3>
          <p class="plan-subtitle">Proteção completa</p>
        </div>
      </div>
      <div class="plan-price-section">
        <p class="plan-price-label">Valor mensal</p>
        <p class="plan-price-value">R$ ${plan.price.toFixed(2).replace('.', ',')}<span class="plan-price-month">/mês</span></p>
      </div>
      <div class="plan-benefits">
        <p class="benefits-title">Incluso no plano:</p>
        ${plan.benefits.map(b => `<div class="benefit-item"><i data-lucide="check"></i><span>${b}</span></div>`).join('')}
      </div>
      <div class="plan-footer">
        <p class="secure-note">🔒 Pagamento 100% seguro</p>
        <div class="guarantee">
          <span>Garantido por</span>
          <img src="assets/sura (1) (1).png" alt="Sura" class="logo-sura">
        </div>
      </div>
    </div>
  `;
}

function updateSummary() {
  if (!state.plan) return;
  dom('desktop-summary').innerHTML = renderSummaryHtml(state.plan, false);
  dom('mobile-summary-content').innerHTML = renderSummaryHtml(state.plan, true);
  dom('mobile-price').innerText = `R$ ${state.plan.price.toFixed(2).replace('.', ',')}`;
  lucide.createIcons();
}

function updateProgress() {
  const labels = ['Dados pessoais', 'Endereço', 'Pagamento'];
  let html = '';
  for (let i = 1; i <= 3; i++) {
    let circleClass = state.step === i ? 'active' : (i < state.step ? 'completed' : 'pending');
    let content = i < state.step ? `<i data-lucide="check" style="width:1.25rem;height:1.25rem;"></i>` : i;

    html += `
      <div class="progress-step-item">
        <div class="step-circle-wrapper">
          <div class="step-circle ${circleClass}">${content}</div>
          <span class="step-label" style="color:${state.step === i ? 'var(--muted-foreground)' : (i < state.step ? 'var(--primary)' : 'var(--muted-foreground)')}">${labels[i - 1]}</span>
        </div>
        ${i < 3 ? `<div class="step-line ${i < state.step ? 'completed' : 'pending'}"></div>` : ''}
      </div>
    `;
  }
  dom('progress-steps').innerHTML = html;

  lucide.createIcons();
}

function showStep(step) {
  dom('step-1').style.display = 'none';
  dom('step-2').style.display = 'none';
  dom('step-3').style.display = 'none';
  dom('step-' + step).style.display = 'block';
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mobile Summary Toggle
let mobileSummaryOpen = false;
dom('mobile-summary-btn').addEventListener('click', () => {
  mobileSummaryOpen = !mobileSummaryOpen;
  dom('mobile-summary-content').style.display = mobileSummaryOpen ? 'block' : 'none';
  dom('mobile-summary-icon').setAttribute('data-lucide', mobileSummaryOpen ? 'chevron-up' : 'chevron-down');
  lucide.createIcons();
});

// Setup Form Steps
function bindMasks() {
  const handleMask = (id, fn) => {
    dom(id).addEventListener('input', (e) => {
      let val = fn(e.target.value);
      e.target.value = val;
      if (['cpf', 'email', 'nomeCompleto', 'celular', 'telefone', 'sexo', 'dataNascimento'].includes(id)) state.personal[id] = val;
      else if (['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'].includes(id)) state.address[id] = val;
      else state.payment[id] = val;
    });
  };

  handleMask('cpf', maskCPF);
  handleMask('celular', maskCelular);
  handleMask('telefone', maskTelefone);
  handleMask('dataNascimento', maskDate);
  handleMask('cep', maskCEP);
  handleMask('numeroCartao', maskCardNumber);
  handleMask('expiracao', maskExpiration);

  dom('cvv').addEventListener('input', (e) => {
    let max = 4;
    let val = maskCVV(e.target.value, max);
    e.target.value = val;
    state.payment.cvv = val;
  });

  // Basic binds
  ['email', 'nomeCompleto', 'sexo'].forEach(id => {
    dom(id).addEventListener('input', e => state.personal[id] = e.target.value);
  });
  ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'].forEach(id => {
    dom(id).addEventListener('input', e => state.address[id] = e.target.value);
  });
  ['titularCartao'].forEach(id => {
    dom(id).addEventListener('input', e => state.payment[id] = e.target.value);
  });
}

function loadFields() {
  // Populate Drops
  let ufHtml = '<option value="">Selecione</option>';
  UF_LIST.forEach(uf => ufHtml += `<option value="${uf}">${uf}</option>`);
  dom('estado').innerHTML = ufHtml;

  // Restore personal
  Object.keys(state.personal).forEach(k => { if (dom(k)) dom(k).value = state.personal[k] || ''; });
  Object.keys(state.address).forEach(k => { if (dom(k)) dom(k).value = state.address[k] || ''; });
  Object.keys(state.payment).forEach(k => { if (dom(k)) dom(k).value = state.payment[k] || ''; });
}

// CEP fetch auto
dom('cep').addEventListener('input', async (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length === 8) {
    dom('cep-loading').style.display = 'block';
    dom('cep').disabled = true;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
      const data = await res.json();
      if (!data.erro) {
        dom('logradouro').value = data.logradouro || ''; state.address.logradouro = data.logradouro || '';
        dom('bairro').value = data.bairro || ''; state.address.bairro = data.bairro || '';
        dom('cidade').value = data.localidade || ''; state.address.cidade = data.localidade || '';
        dom('estado').value = data.uf || ''; state.address.estado = data.uf || '';
        setError('cep', '');
      } else { setError('cep', 'CEP não encontrado.'); }
    } catch (err) { setError('cep', 'Erro ao buscar.'); }
    finally {
      dom('cep-loading').style.display = 'none';
      dom('cep').disabled = false;
      dom('numero').focus();
    }
  }
});

// Step 1 Validation
dom('btn-next-1').addEventListener('click', () => {
  let valid = true;
  if (!validateCPF(state.personal.cpf)) { setError('cpf', 'CPF inválido. Confira os números e tente novamente.'); valid = false; } else setError('cpf', '');
  if (!validateEmail(state.personal.email)) { setError('email', 'Digite um e-mail válido.'); valid = false; } else setError('email', '');
  if (!validateFullName(state.personal.nomeCompleto)) { setError('nomeCompleto', 'Digite seu nome e sobrenome.'); valid = false; } else setError('nomeCompleto', '');
  if (!validateCelular(state.personal.celular)) { setError('celular', 'Número inválido. Ex: (11) 91234-5678'); valid = false; } else setError('celular', '');

  if (state.personal.telefone && state.personal.telefone.replace(/\D/g, '').length !== 10) { setError('telefone', 'Telefone inválido. Ex: (11) 1234-5678'); valid = false; } else setError('telefone', '');

  if (!state.personal.sexo) { setError('sexo', 'Selecione o sexo.'); valid = false; } else setError('sexo', '');

  const dateResult = validateDate(state.personal.dataNascimento);
  if (!dateResult.valid) {
    setError('dataNascimento', 'Data inválida. Use DD/MM/AAAA.'); valid = false;
  } else if (dateResult.date) {
    const age = (Date.now() - dateResult.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) { setError('dataNascimento', 'Você precisa ter pelo menos 18 anos.'); valid = false; }
    else setError('dataNascimento', '');
  }

  if (valid) { state.step = 2; saveState(); showStep(2); }
});

// Step 2 Validation
dom('btn-back-2').addEventListener('click', () => { state.step = 1; saveState(); showStep(1); });
dom('btn-next-2').addEventListener('click', () => {
  let valid = true;
  if (state.address.cep.length < 9) { setError('cep', 'CEP inválido. Informe 8 dígitos.'); valid = false; } else setError('cep', '');
  if (!state.address.logradouro.trim()) { setError('logradouro', 'Informe o logradouro.'); valid = false; } else setError('logradouro', '');
  if (!state.address.numero.trim()) { setError('numero', 'Informe o número.'); valid = false; } else setError('numero', '');
  if (!state.address.bairro.trim()) { setError('bairro', 'Informe o bairro.'); valid = false; } else setError('bairro', '');
  if (!state.address.cidade.trim()) { setError('cidade', 'Informe a cidade.'); valid = false; } else setError('cidade', '');
  if (!state.address.estado) { setError('estado', 'Selecione o estado.'); valid = false; } else setError('estado', '');

  if (valid) { state.step = 3; saveState(); showStep(3); }
});

// Step 3 Validation & Submit
dom('btn-back-3').addEventListener('click', () => { state.step = 2; saveState(); showStep(2); });
dom('btn-submit').addEventListener('click', async () => {
  let valid = true;
  if (!luhnCheck(state.payment.numeroCartao)) { setError('numeroCartao', 'Número do cartão inválido.'); valid = false; } else setError('numeroCartao', '');
  if (!state.payment.titularCartao.trim()) { setError('titularCartao', 'Informe o titular do cartão.'); valid = false; } else setError('titularCartao', '');
  if (!validateExpiration(state.payment.expiracao)) { setError('expiracao', 'Data de expiração inválida. Use MM/AA.'); valid = false; } else setError('expiracao', '');

  let cvvDigits = state.payment.cvv.replace(/\D/g, '');
  if (cvvDigits.length < 3 || cvvDigits.length > 4) { setError('cvv', 'CVV deve ter 3 ou 4 dígitos.'); valid = false; } else setError('cvv', '');

  if (valid) {
    const btn = dom('btn-submit');
    const ogHtml = btn.innerHTML;
    btn.innerHTML = `<span class="loading-spin">⟳</span> Processando...`;
    btn.disabled = true;

    // Simulate API Check
    await new Promise(r => setTimeout(r, 2000));
    const success = Math.random() > 0.3;
    if (success) {
      state.proposalNumber = 'LF-' + Math.floor(100000 + Math.random() * 900000);
      saveState();
      window.location.href = 'obrigado.html';
    } else {
      window.location.href = 'erro.html';
    }
  }
});

// Mount / Init
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  const params = new URLSearchParams(window.location.search);
  const planoParam = params.get('plano');
  if (planoParam && PLANS_CATALOG[planoParam.toLowerCase()]) {
    state.planId = planoParam.toLowerCase();
    state.plan = PLANS_CATALOG[state.planId];
    saveState();
  } else if (!state.planId || !PLANS_CATALOG[state.planId]) {
    dom('app-container').style.display = 'none';
    dom('no-plan-container').style.display = 'flex';
    return;
  } else {
    state.plan = PLANS_CATALOG[state.planId];
  }

  dom('app-container').style.display = 'flex';
  dom('no-plan-container').style.display = 'none';

  loadFields();
  bindMasks();
  updateSummary();
  showStep(state.step);
});