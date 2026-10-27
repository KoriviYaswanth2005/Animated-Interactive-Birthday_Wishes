// Her photos. The files p1.png to p5.png must sit in the same folder as index.html.
const PHOTOS = ["p1.png", "p2.png", "p3.png", "p4.png", "p5.png"];

document.querySelectorAll("img[data-photo]").forEach(function (img) {
  img.src = PHOTOS[Number(img.dataset.photo)];
});
(function(){
  const root = document.documentElement;
  const cfgs = {
    't-blush':   {colors:['#f7a8c0','#ffd3df','#ffffff','#e0668a'], shape:'petal',   count:50, mode:'fall'},
    't-night':   {colors:['#ffd166','#ffffff','#9ad1ff','#ff8fab'], shape:'star',    count:130, mode:'twinkle'},
    't-gold':    {colors:['#e8b04b','#fff1c1','#c9892b','#fffaf0'], shape:'rect',    count:80, mode:'fall'},
    't-balloon': {colors:['#ff8fa3','#9be7ff','#ffe066','#b6f2a0','#c7a6ff'], shape:'balloon', count:16, mode:'rise'}
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  let W, H, dpr, theme = 't-blush', parts = [];

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeAmbient(c, initial){
    const p = {x: rnd(0, W), y: -20, r: rnd(6, 14), rot: rnd(0, 6.28), vr: rnd(-.02, .02),
               sway: rnd(0, 6.28), vx: rnd(-.3, .3), vy: rnd(.6, 1.6), c: pick(c.colors), burst: false, life: 1};
    if (c.mode === 'rise'){ p.r = rnd(16, 24); p.vy = -rnd(.6, 1.3); p.y = initial ? rnd(0, H) : H + 40; p.rot = 0; p.vr = 0; }
    else if (c.mode === 'twinkle'){ p.r = rnd(.8, 2.4); p.vy = 0; p.vx = 0; p.y = rnd(0, H); p.x = rnd(0, W); }
    else { p.y = initial ? rnd(0, H) : -20; }
    return p;
  }

  function reset(){
    const c = cfgs[theme];
    parts = [];
    for (let i = 0; i < c.count; i++) parts.push(makeAmbient(c, true));
  }

  function burst(x, y){
    const c = cfgs[theme];
    const shape = c.shape === 'balloon' ? 'petal' : c.shape;
    for (let i = 0; i < 40; i++){
      parts.push({x, y, vx: rnd(-6, 6), vy: rnd(-11, -3), r: rnd(4, 9), rot: rnd(0, 6.28), vr: rnd(-.2, .2),
                  sway: 0, c: pick(c.colors), burst: true, life: 1, shape});
    }
  }

  function draw(p, c){
    ctx.save();
    ctx.globalAlpha = p.burst ? Math.max(p.life, 0) : (c.mode === 'twinkle' ? .4 + .6 * Math.abs(Math.sin(p.sway)) : .85);
    ctx.fillStyle = p.c;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const s = p.shape || c.shape;
    if (s === 'petal'){ ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); ctx.fill(); }
    else if (s === 'rect'){ ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
    else if (s === 'star'){ ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); }
    else if (s === 'balloon'){
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * .85, p.r, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(60,60,80,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, p.r); ctx.quadraticCurveTo(-6, p.r + 18, 2, p.r + 34); ctx.stroke();
    }
    ctx.restore();
  }

  function step(){
    const c = cfgs[theme];
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--){
      const p = parts[i];
      if (p.burst){
        p.vy += .18; p.vx *= .98; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .012;
        if (p.life <= 0){ parts.splice(i, 1); continue; }
      } else {
        p.sway += .02;
        p.x += p.vx + Math.sin(p.sway) * .4;
        p.y += p.vy;
        p.rot += p.vr;
        if (c.mode === 'twinkle') p.sway += .05;
        else if (p.y > H + 60 || p.y < -60){ Object.assign(p, makeAmbient(c, false)); p.x = rnd(0, W); if (c.mode === 'rise') p.y = H + 40; }
      }
      draw(p, c);
    }
  }

  function loop(){ step(); requestAnimationFrame(loop); }

  // Photo carousel: fades between slides, autoplays, and supports swipe
  const slides = Array.from(document.querySelectorAll('.slide'));
  const carousel = document.querySelector('.carousel');
  let cur = 0, auto = null, startX = null;
  function go(i){
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, j) => { s.classList.toggle('is-active', j === cur); s.setAttribute('aria-hidden', String(j !== cur)); });
  }
  function restart(){
    clearInterval(auto);
    if (!reduce) auto = setInterval(() => go(cur + 1), 3000);
  }
  carousel.addEventListener('pointerdown', e => { startX = e.clientX; });
  carousel.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40){ go(dx < 0 ? cur + 1 : cur - 1); restart(); }
  });
  go(0);
  restart();

  // Countdown to December 27, 2026 (India time)
  const target = new Date('2026-12-27T00:00:00+05:30');
  const cdMsg = document.getElementById('cd-msg');
  const pad = n => String(n).padStart(2, '0');
  function countdown(){
    const diff = target - new Date();
    if (diff <= 0){
      ['d', 'h', 'm', 's'].forEach(k => document.getElementById('cd-' + k).textContent = '0');
      cdMsg.textContent = 'Happy birthday, Kokku!';
      clearInterval(cdTimer);
      return;
    }
    document.getElementById('cd-d').textContent = Math.floor(diff / 864e5);
    document.getElementById('cd-h').textContent = pad(Math.floor(diff % 864e5 / 36e5));
    document.getElementById('cd-m').textContent = pad(Math.floor(diff % 36e5 / 6e4));
    document.getElementById('cd-s').textContent = pad(Math.floor(diff % 6e4 / 1e3));
  }
  countdown();
  const cdTimer = setInterval(countdown, 1000);

  // Relation picker: the visitor says who they are, and the WhatsApp message, copyable wish and sign-off follow
  const relWishes = {Friend:'from your friend', Cousin:'from your cousin', Brother:'from your brother', Sister:'from your sister', Colleague:'from your colleague', Bava:'from your bava', Other:'from someone who cares about you'};
  const signs = {Friend:'your friend', Cousin:'your cousin', Brother:'your brother', Sister:'your sister', Colleague:'your colleague', Bava:'your bava', Other:'someone who loves you'};
  const relSel = document.getElementById('relation');
  const relOut = document.getElementById('relWish');
  const waBtn = document.getElementById('waBtn');
  const signEl = document.getElementById('sign');
  const relMsgEl = document.getElementById('relMsg');
  const relMsgs = {
    Friend: 'Dear Surekha, as your friend, I send you advance birthday wishes for your birthday on December 27, 2026. May it be full of fun, laughter and wonderful memories.',
    Cousin: 'Dear Surekha, as your cousin, I send you advance birthday wishes for your birthday on December 27, 2026. May it be full of happy family moments and lots of love.',
    Brother: 'Dear Surekha, as your brother, I send you advance birthday wishes for your birthday on December 27, 2026. May it be full of love, laughter and everything your heart hopes for.',
    Sister: 'Dear Surekha, as your sister, I send you advance birthday wishes for your birthday on December 27, 2026. May it be filled with joy, sweet moments and endless smiles.',
    Colleague: 'Dear Surekha, as your colleague, I send you advance birthday wishes for your birthday on December 27, 2026, and a year full of success and smiles.',
    Bava: 'Dear Surekha, as your bava, I send you advance birthday wishes for your birthday on December 27, 2026. May it be filled with family warmth, happy moments and lots of love.',
    Other: 'Dear Surekha, someone who cares about you sends advance birthday wishes for your birthday on December 27, 2026. May it be filled with love, happiness and beautiful moments.'
  };
  function updateRelation(){
    const r = relSel.value;
    const base = 'Advance birthday wishes, Kokku! Wishing you a wonderful day ahead';
    const text = r ? base + ', ' + relWishes[r] + '.' : base + '.';
    relOut.textContent = text;
    waBtn.href = 'https://wa.me/918919292016?text=' + encodeURIComponent(text);
    signEl.textContent = r ? 'With all my love, ' + (visitorName ? visitorName + ', ' : '') + signs[r] : 'With all my love, always';
    relMsgEl.textContent = r ? relMsgs[r].replace('Dear Surekha, ', visitorName ? 'Dear Surekha, from ' + visitorName + ' (' + r.toLowerCase() + '), ' : 'Dear Surekha, ') : '';
    document.querySelectorAll('[data-rel-line]').forEach(el => {
      el.textContent = r ? 'Advance birthday wishes ' + relWishes[r] + '.' : '';
    });
  }
  relSel.addEventListener('change', updateRelation);
  // On load, a welcome panel asks the visitor's relation; choosing one shows that relation's wish
  const gate = document.getElementById('gate');
  const thanksMsgs = {
    Friend: 'Thank you, friend, for your lovely wishes!',
    Cousin: 'Thank you, cousin, for your lovely wishes!',
    Brother: 'Thank you, brother, for your lovely wishes!',
    Sister: 'Thank you, sister, for your lovely wishes!',
    Colleague: 'Thank you, colleague, for your lovely wishes!',
    Bava: 'Thank you, bava, for your lovely wishes!',
    Other: 'Thank you for your lovely wishes!'
  };
  const toast = document.getElementById('toast');
  let toastTimer = null;
  let visitorName = '';
  function chooseRelation(r){
    visitorName = document.getElementById('visitorName').value.trim();
    gate.hidden = true;
    gate.style.display = 'none';
    relSel.value = r;
    updateRelation();
    toast.textContent = visitorName
      ? 'Thank you, ' + visitorName + ', for your lovely wishes!'
      : (thanksMsgs[r] || 'Thank you for your wishes!');
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
  }
  document.querySelectorAll('.gate-opt').forEach(b => b.addEventListener('click', () => chooseRelation(b.dataset.rel)));
  updateRelation();
  document.getElementById('copyWish').addEventListener('click', e => {
    const btn = e.currentTarget;
    navigator.clipboard.writeText(relOut.textContent).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy my wish'; }, 1600);
    }).catch(() => { btn.textContent = 'Select the text to copy'; });
  });

  // Party RSVP: shows a reply on this visitor's screen only
  document.querySelectorAll('[data-rsvp]').forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset.rsvp;
      const r = relSel.value;
      const relWord = r && r !== 'Other' ? r.toLowerCase() : '';
      const who = visitorName ? visitorName + (relWord ? ' (' + relWord + ')' : '') : relWord;
      const answer = v === 'Yes' ? "Yes, I'm coming to the celebration!" : v === 'Maybe' ? "Maybe, I'll let you know soon." : "Sorry, I can't make it this time.";
      const text = 'Join celebration answer' + (who ? ' from ' + who : '') + ': ' + answer;
      const reply = v === 'Yes' ? 'Thank you' + (who ? ', ' + who : '') + '! We look forward to celebrating with you.' :
        v === 'Maybe' ? 'Thanks' + (who ? ', ' + who : '') + '! Let us know once you decide.' :
        'Thanks for letting us know' + (who ? ', ' + who : '') + '. You will be missed.';
      document.getElementById('rsvpMsg').textContent = reply + ' Tap below to send your answer on WhatsApp.';
      toast.textContent = reply;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
      const wa = document.getElementById('rsvpWa');
      wa.href = 'https://wa.me/918919292016?text=' + encodeURIComponent(text);
      wa.hidden = false;
      document.getElementById('fromHer').hidden = false;
      const herMsgs = {"Friend": "Thank you, my friend, for your lovely wishes. Having you in my life makes every celebration more special.", "Cousin": "Thank you, cousin, for your warm wishes. Our family moments mean so much to me.", "Brother": "Thank you, brother, for your kind wishes. Your love and support mean everything to me.", "Sister": "Thank you, sister, for your sweet wishes. I'm lucky to have you, and your love makes my day brighter.", "Colleague": "Thank you, colleague, for your kind wishes. I appreciate your good thoughts and our time working together.", "Bava": "Thank you, bava, for your kind wishes. Your blessings and warmth mean a lot to me.", "Other": "Thank you for your kind wishes. Your thoughtfulness means a lot to me."};
      document.getElementById('fromHerText').textContent = (r && herMsgs[r]) || document.getElementById('fromHerText').dataset.general;
    });
  });

  // Typed tagline
  const lines = ['Advance birthday wishes, Kokku!', 'Sending you all my love for your birthday on December 27.'];
  const el = document.getElementById('typed');
  let run = 0;
  function type(){
    const id = ++run;
    if (reduce){ el.textContent = lines.join(' '); return; }
    let li = 0, ci = 0;
    (function tick(){
      if (id !== run) return;
      if (li >= lines.length) return;
      const s = lines[li];
      if (ci <= s.length){
        el.textContent = lines.slice(0, li).join(' ') + (li ? ' ' : '') + s.slice(0, ci);
        ci++;
        setTimeout(tick, 45);
      } else {
        li++; ci = 0;
        setTimeout(tick, 500);
      }
    })();
  }

  // Design switching
  document.querySelectorAll('.switch button').forEach(b => {
    b.addEventListener('click', () => {
      theme = b.dataset.theme;
      root.className = theme;
      document.querySelectorAll('.switch button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      reset();
    });
  });

  document.getElementById('replay').addEventListener('click', type);

  document.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || reduce) return;
    burst(e.clientX, e.clientY);
  });

  window.addEventListener('resize', () => { size(); reset(); });

  root.className = theme;
  size();
  reset();
  type();
  if (reduce) step(); else loop();
})();
