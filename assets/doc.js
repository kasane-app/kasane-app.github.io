/* 文書ページ(プライバシーポリシー・サポート)の版面を、Markdown から書き出された見出しから組み立てる。
   文章は privacy.md・support.md のまま変えず、並べ方だけを試作(和紙の版)に合わせる。
   ・題(h1)を左の縦書きに ・h2 ごとに節に分け、目次を作る ・お問い合わせの紙 ・よくある質問は開いて読む形
   この処理が動かないときも、文章はそのまま読める */
(() => {
  const body = document.querySelector('.doc__body');
  const side = document.querySelector('.doc__side');
  const toc = side && side.querySelector('.toc');
  if (!body || !toc) return;
  const KANJI = '一二三四五六七八九十';
  const SHORT = {
    'ファイル・クリップボード・スクリーンショット・バックアップ・シェア画像': 'ファイル・スクリーンショットなど',
    'アクセス解析・広告・トラッキング': 'アクセス解析・広告',
  };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const entries = [];  // 目次に載せる [id, 番号, 名前]

  // 題:h1 を左へ(「Kasane 〜」の Kasane は欧文の書体に)
  const h1 = body.querySelector('h1');
  if (h1) {
    const t = el('h1', 'doc__title');
    const m = h1.textContent.match(/^Kasane\s+(.*)$/);
    if (m) { t.append(el('span', 'latin', 'Kasane'), ' ' + m[1]); } else { t.textContent = h1.textContent; }
    side.append(t);
    h1.remove();
  }

  // 最初の段落(日付ではないもの)は、前書きとして少し大きく
  for (const c of body.children) {
    if (c.tagName === 'H2' || c.classList.contains('card')) break;
    if (c.tagName === 'P' && !c.classList.contains('meta')) { c.classList.add('lede'); break; }
  }

  // お問い合わせの紙:「**お問い合わせ**: [メール](mailto:…)」の段落を、見出しと大きなアドレスに
  const card = body.querySelector(':scope > .card');
  if (card) {
    card.className = 'contact';
    card.id = 'contact';
    const first = card.querySelector('p');
    const mail = first && first.querySelector('a[href^="mailto:"]');
    if (mail) {
      const label = el('p', 'contact__label', (first.querySelector('strong') || {}).textContent || 'お問い合わせ');
      mail.className = 'mail';
      mail.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>');
      first.replaceWith(label, mail);
    }
    entries.push(['contact', null, label_of(card)]);
  }
  function label_of(c) { const l = c.querySelector('.contact__label'); return l ? l.textContent : 'お問い合わせ'; }

  // 節:h2 から次の h2 の手前までを、ひとつの節に
  const h2s = [...body.querySelectorAll(':scope > h2')];
  h2s.forEach((h2, k) => {
    const sec = el('section');
    sec.id = 's' + (k + 1);
    h2.before(sec);
    let n = h2;
    while (n && !(n !== h2 && n.tagName === 'H2')) { const next = n.nextElementSibling; sec.append(n); n = next; }
    const m = h2.textContent.match(/^(\d+\.)\s*(.*)$/);
    const name = m ? m[2] : h2.textContent;
    if (m) { h2.textContent = ''; h2.append(el('span', 'no', m[1]), name); }
    entries.push([sec.id, m ? m[1] : null, SHORT[name] || name]);
    if (k === 0 && m && m[1] === '1.') sec.classList.add('promise');  // 1(基本方針)は約束として紙を一枚重ねる
    if (name === 'よくある質問') faq(sec);
  });

  // よくある質問:質問(h3)ごとに、開いて読む形に。最初の1つは開いておく
  function faq(sec) {
    const qs = [...sec.querySelectorAll('h3')];
    if (!qs.length) return;
    // 先に、質問ごとの答え(次の質問の手前まで)を集めてから組み立てる
    const groups = qs.map(h3 => {
      const ans = [];
      for (let n = h3.nextElementSibling; n && n.tagName !== 'H3'; n = n.nextElementSibling) ans.push(n);
      return [h3, ans];
    });
    let box = sec.querySelector('.faq');
    if (!box) { box = el('div', 'faq'); qs[0].before(box); }
    groups.forEach(([h3, ans], i) => {
      const d = el('details');
      if (i === 0) d.open = true;
      const s = el('summary');
      s.append(el('span', 'q', 'Q.'), el('span', null, h3.textContent.replace(/^Q\.\s*/, '')));
      const a = el('div', 'faq__a');
      const mark = el('span', 'a', 'A.'); mark.setAttribute('aria-hidden', 'true');
      const inner = el('div');
      inner.append(...ans);
      const p = inner.firstElementChild;
      if (p && p.firstChild && p.firstChild.nodeType === 3) p.firstChild.nodeValue = p.firstChild.nodeValue.replace(/^A\.\s*/, '');
      a.append(mark, inner);
      d.append(s, a);
      box.append(d);
      h3.remove();
    });
  }

  // 表:紙の罫線の表に(狭い画面では1行ずつ)
  body.querySelectorAll('table').forEach(t => t.classList.add('table'));

  // 目次
  entries.forEach(([id, no, name], k) => {
    const li = el('li'), a = el('a');
    a.href = '#' + id;
    a.append(el('span', null, no || KANJI[k] || String(k + 1)), name);
    li.append(a); toc.append(li);
  });
  side.hidden = false;

  // 目次:いま読んでいる節に色の線を引く
  const links = [...toc.querySelectorAll('a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) {
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = map.get(e.target.id); if (a) a.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();
