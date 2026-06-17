const form = document.getElementById('receptionForm');
const ledgerText = document.getElementById('ledgerText');
const promptText = document.getElementById('promptText');
const postText = document.getElementById('postText');
const residentList = document.getElementById('residentList');
const toastEl = document.getElementById('toast');
const storageKey = 'majinIslandReceptionDrafts';

let currentDraft = null;
let activePane = postText;

const departments = {
  '移住者受付': '入島者の名前を魔人簿へ照合する係',
  '魔人シネマ': '半券を切り、歓迎上映へ案内する係',
  '屋台通り': '小籠包、肉まん、あんまんを配る係',
  '巨大書庫': '魔人簿の頁を探し、赤い印を押す係',
  '港の案内所': '帰りの船があるように見せかける係',
  '女神バイト': '崇められつつ雑務もこなす係',
  '未配属の住民': '島内を歩くだけで噂になる住民'
};

function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

function normalizeHandle(handle) {
  const trimmed = handle.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function createDraft(values) {
  const name = values.name.trim() || '名もなき来島者';
  const handle = normalizeHandle(values.handle);
  const role = departments[values.assignment] || '島内で役割を得る住民';
  const traitLine = values.traits.trim() || '元キャラの特徴は、投稿画像と作者コメントを優先して保持する。';
  const memo = values.memo.trim();
  const intensity = {
    soft: '30分ほどで外見は戻るが、魔人簿には名前が残る',
    standard: '島の住民として定着し、日常の役割を持つ',
    deep: '島の神話に組み込まれ、地形や噂にも影響する'
  }[values.intensity];

  const ledger = [
    `【魔人簿 登録】${name}`,
    handle ? `記録元: ${handle}` : '記録元: 未記入',
    `来島区分: ${values.visitType}`,
    `魔人化トリガー: ${values.trigger}`,
    `配属先: ${values.assignment} - ${role}`,
    `定着度: ${intensity}`,
    '',
    '受付を済ませると、巨大な書庫から魔人簿が開いた。',
    `そこには、なぜかすでに「${name}」の名と、魔人化した姿が記されていた。`,
    '',
    `元キャラの核: ${traitLine}`,
    memo ? `島内メモ: ${memo}` : '島内メモ: 歓迎会、食べ物、受付、映画館などの小ネタを足すと参加しやすい。',
    '',
    '扱い: 二次使用、コラボ可能な範囲で #魔人島 の住民として登場可能。'
  ].join('\n');

  const prompt = [
    'AI image generation prompt:',
    `Create a Majin Island resident transformation for "${name}".`,
    `Original character core to preserve: ${traitLine}`,
    `Transformation trigger: ${values.trigger}. Assignment: ${values.assignment}.`,
    'Visual direction: Japanese uncanny resort island, official immigration ledger, old paper texture, red seal stamp, gold frame, harbor, cinema sign, food stalls, strange but welcoming fantasy atmosphere.',
    'Character design: keep the source silhouette, representative colors, memorable accessories, personality impression, and turn them into a distinct majin resident. Add non-human aura, subtle horns or abnormal eyes, magical markings, island staff details, and one clear role prop.',
    `Tone: playful, welcoming, slightly suspicious, community-driven #魔人島 improvisation. ${memo}`,
    'Avoid: generic demon cosplay, losing the source character identity, unreadable cluttered text, unrelated dark fantasy, excessive gore.'
  ].join('\n');

  const post = [
    `#魔人島`,
    `${name} さん、入島受付完了。`,
    `${values.trigger}をきっかけに魔人簿が開き、配属先は「${values.assignment}」になりました。`,
    intensity,
    memo ? `\n${memo}` : '',
    '',
    '移住、留学、観光、スタッフ応募、歓迎します。'
  ].filter(Boolean).join('\n');

  return {
    name,
    handle,
    visitType: values.visitType,
    trigger: values.trigger,
    assignment: values.assignment,
    intensity: values.intensity,
    traits: values.traits.trim(),
    memo,
    sourceUrl: values.sourceUrl.trim(),
    ledger,
    prompt,
    post
  };
}

function formValues() {
  return Object.fromEntries(new FormData(form).entries());
}

function renderDraft(draft) {
  currentDraft = draft;
  ledgerText.value = draft.ledger;
  promptText.value = draft.prompt;
  postText.value = draft.post;
  activateTab('postText');
}

function activateTab(id) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === id);
  });
  document.querySelectorAll('.result-pane').forEach((pane) => {
    pane.hidden = pane.id !== id;
  });
  activePane = document.getElementById(id);
}

async function copyText(text) {
  if (!text.trim()) {
    toast('コピーする内容がありません。');
    return;
  }
  await navigator.clipboard.writeText(text);
  toast('コピーしました。');
}

function openTweet(text) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function readLocalResidents() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

function writeLocalResidents(records) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function loadResidents() {
  const residents = readLocalResidents();
  residentList.innerHTML = residents.map((resident) => `
    <article class="resident">
      <header>
        <div>
          <strong>${escapeHtml(resident.name)}</strong>
          <p>${escapeHtml(resident.handle || '記録元未記入')}</p>
        </div>
        <button data-delete="${resident.id}">削除</button>
      </header>
      <p>${escapeHtml(resident.trigger)} / ${escapeHtml(resident.assignment)}</p>
      <p>${escapeHtml(resident.memo || resident.traits || '島内記録のみ')}</p>
      ${resident.sourceUrl ? `<p><a href="${escapeHtml(resident.sourceUrl)}" target="_blank" rel="noreferrer">X投稿を開く</a></p>` : ''}
    </article>
  `).join('') || '<p>X投稿を正本にして、この欄は投稿URLや作業中メモの控えとして使います。サーバーには保存されません。</p>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function drawMap() {
  const canvas = document.getElementById('islandMap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, '#0d2a2f');
  grd.addColorStop(1, '#14130d');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(208, 163, 79, .28)';
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(260, 170, 50 + i * 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#314a2e';
  ctx.beginPath();
  ctx.moveTo(120, 210);
  ctx.bezierCurveTo(110, 130, 180, 70, 260, 85);
  ctx.bezierCurveTo(360, 70, 430, 150, 390, 230);
  ctx.bezierCurveTo(330, 285, 190, 280, 120, 210);
  ctx.fill();

  ctx.fillStyle = '#5b4a27';
  ctx.beginPath();
  ctx.moveTo(210, 210);
  ctx.lineTo(255, 98);
  ctx.lineTo(308, 212);
  ctx.closePath();
  ctx.fill();

  const points = [
    ['受付', 150, 205, '#b84235'],
    ['書庫', 235, 150, '#d0a34f'],
    ['魔人シネマ', 320, 190, '#4f9d93'],
    ['屋台', 275, 240, '#c46d35'],
    ['港', 365, 235, '#7aa8c2']
  ];
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  for (const [label, x, y, color] of points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.fillText(label, x, y - 14);
  }

  ctx.fillStyle = '#d0a34f';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('魔人島 案内図', 28, 48);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#b9b09c';
  ctx.fillText('食べ物を受け取る前に受付へ', 30, 72);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderDraft(createDraft(formValues()));
  toast('X投稿文を作成しました。');
});

document.getElementById('sampleBtn').addEventListener('click', () => {
  form.name.value = '新入りの旅人';
  form.handle.value = '@sample';
  form.visitType.value = '見学';
  form.trigger.value = '小籠包';
  form.assignment.value = '魔人シネマ';
  form.intensity.value = 'standard';
  form.traits.value = '黒髪、丸い眼鏡、白い上着、好奇心が強い。手帳を持っている。';
  form.memo.value = '歓迎会でフリー小籠包を受け取り、そのままモギリのアルバイトに配属。';
  renderDraft(createDraft(formValues()));
});

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
  });
});

document.getElementById('copyActiveBtn').addEventListener('click', () => copyText(activePane.value));

document.getElementById('tweetBtn').addEventListener('click', () => {
  const text = postText.value.trim() || createDraft(formValues()).post;
  openTweet(text);
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const draft = { ...(currentDraft || createDraft(formValues())), id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const residents = readLocalResidents();
  residents.unshift(draft);
  writeLocalResidents(residents);
  loadResidents();
  toast('この端末に控えました。公開データはX投稿を正本にしてください。');
});

residentList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  writeLocalResidents(readLocalResidents().filter((resident) => resident.id !== button.dataset.delete));
  loadResidents();
  toast('削除しました。');
});

drawMap();
loadResidents();
