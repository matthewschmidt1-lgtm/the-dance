// Illustrated characters and environments, drawn as SVG.
// Characters are adults at roughly 8 heads tall, built from a look (skin, hair, clothing)
// plus a mood (brows, eyes, mouth, head tilt) and a pose (arm positions, held prop).
// Moods switch with CSS classes; poses re-render the arms group.
window.PP = window.PP || {};

PP.art = (function () {
  let uid = 0;
  // Bump when rendered images change, so browsers fetch the new files.
  PP.assetV = '13';

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ───────────────────────── Faces

  const MOODS = ['neutral', 'smile', 'happy', 'nervous', 'frustrated', 'surprised', 'skeptical', 'sad', 'confident', 'awkward', 'thinking'];

  const BROW = {
    flat: 'M-18,-520 Q-12,-523 -5,-520',
    raised: 'M-18,-527 Q-12,-531 -5,-527',
    frown: 'M-18,-523 Q-12,-523 -5,-517',
    worried: 'M-18,-518 Q-12,-522 -5,-525',
    soft: 'M-18,-521 Q-12,-525 -5,-522'
  };
  const BROWS_BY_MOOD = {
    neutral: ['flat', 'flat'], smile: ['soft', 'soft'], happy: ['raised', 'raised'],
    nervous: ['worried', 'worried'], frustrated: ['frown', 'frown'], surprised: ['raised', 'raised'],
    skeptical: ['frown', 'raised'], sad: ['worried', 'worried'], confident: ['flat', 'soft'],
    awkward: ['worried', 'flat'], thinking: ['flat', 'raised']
  };

  function mouths(lip) {
    const s = `fill="none" stroke="${lip}" stroke-width="2.6" stroke-linecap="round"`;
    return {
      neutral: `<path d="M-8,-484 Q0,-483 8,-484" ${s}/>`,
      smile: `<path d="M-10,-486 Q0,-478 10,-486" ${s}/>`,
      happy: `<path d="M-11,-487 Q0,-472 11,-487 Q0,-484 -11,-487 Z" fill="${lip}"/><path d="M-9,-486 Q0,-483.5 9,-486 L8,-484.2 Q0,-482 -8,-484.2 Z" fill="#fbf7f1"/>`,
      nervous: `<path d="M-8,-482 Q-4,-485 0,-482 Q4,-479 8,-482" ${s}/>`,
      frustrated: `<path d="M-9,-481 Q0,-486 9,-481" ${s}/>`,
      surprised: `<ellipse cx="0" cy="-482" rx="4.5" ry="6" fill="${lip}"/>`,
      skeptical: `<path d="M-8,-482 Q1,-484 9,-488" ${s}/>`,
      sad: `<path d="M-8,-480 Q0,-486 8,-480" ${s}/>`,
      confident: `<path d="M-9,-485 Q3,-481 10,-488" ${s}/>`,
      awkward: `<rect x="-9" y="-486" width="18" height="5" rx="2" fill="#fbf7f1" stroke="${lip}" stroke-width="1.6"/>`,
      thinking: `<path d="M-6,-483 Q2,-484 7,-481" ${s}/>`
    };
  }

  // ───────────────────────── Hair

  function hair(style, c) {
    const f = `fill="${c}"`;
    const d = shade(c, -0.18);
    switch (style) {
      case 'short': return { back: '', front: `<path ${f} d="M-28,-506 C-31,-540 -16,-552 2,-551 C20,-550 32,-538 28,-504 C26,-520 20,-530 6,-532 C-8,-530 -20,-526 -28,-506 Z"/>` };
      case 'sidepart': return { back: '', front: `<path ${f} d="M-29,-503 C-33,-545 -10,-557 6,-553 C26,-549 33,-532 28,-503 C25,-522 16,-536 -2,-535 C-14,-533 -22,-522 -29,-503 Z"/><path d="M-8,-551 Q-12,-540 -14,-532" stroke="${d}" stroke-width="1.5" fill="none"/>` };
      case 'buzz': return { back: '', front: `<path ${f} opacity=".92" d="M-27,-510 C-28,-544 28,-544 27,-510 C24,-528 -24,-528 -27,-510 Z"/>` };
      case 'bald': return { back: '', front: `<path ${f} d="M-28,-500 C-30,-516 -27,-526 -21,-529 L-22,-503 Z"/><path ${f} d="M28,-500 C30,-516 27,-526 21,-529 L22,-503 Z"/><path d="M-14,-536 Q-4,-541 8,-538" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>` };
      case 'long': return {
        back: `<path ${f} d="M-34,-505 C-42,-562 42,-562 34,-505 L42,-420 C20,-410 -20,-410 -42,-420 Z"/>`,
        front: `<path ${f} d="M-29,-498 C-33,-549 33,-549 29,-498 C27,-520 12,-533 -4,-531 C-16,-527 -25,-516 -29,-498 Z"/>`
      };
      case 'ponytail': return {
        back: `<path ${f} d="M20,-532 C46,-528 50,-482 40,-452 C34,-468 31,-492 22,-512 Z"/>`,
        front: `<path ${f} d="M-28,-504 C-32,-549 32,-549 28,-504 C25,-523 10,-532 -4,-532 C-15,-530 -24,-520 -28,-504 Z"/>`
      };
      case 'bun': return {
        back: `<circle cx="0" cy="-552" r="14" ${f}/>`,
        front: `<path ${f} d="M-28,-504 C-32,-549 32,-549 28,-504 C24,-526 10,-534 0,-534 C-10,-534 -24,-526 -28,-504 Z"/><path d="M-12,-540 Q0,-546 12,-540" stroke="${d}" stroke-width="1.2" fill="none"/>`
      };
      case 'bob': return {
        back: `<path ${f} d="M-35,-505 C-41,-562 41,-562 35,-505 L37,-472 C20,-466 -20,-466 -37,-472 Z"/>`,
        front: `<path ${f} d="M-30,-496 C-34,-551 34,-551 30,-496 C28,-522 16,-534 -8,-528 C-20,-524 -27,-512 -30,-496 Z"/>`
      };
      case 'curly': {
        const back = [[-31, -518, 13], [31, -518, 13], [-27, -540, 14], [27, -540, 14], [-12, -554, 14], [12, -554, 14], [-34, -497, 11], [34, -497, 11], [0, -558, 13]]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${f}/>`).join('');
        const front = [[-20, -536, 10], [-6, -542, 10], [8, -541, 10], [21, -533, 9]]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${f}/>`).join('');
        return { back, front };
      }
      default: return { back: '', front: '' };
    }
  }

  // ───────────────────────── Arms and props

  const SH = { L: [-54, -442], R: [54, -442] };
  const POSES = {
    down: { L: [[-66, -345], [-64, -270]], R: [[66, -345], [64, -270]] },
    hips: { L: [[-94, -352], [-58, -284]], R: [[94, -352], [58, -284]] },
    crossed: { L: [[-62, -352], [30, -376]], R: [[62, -352], [-30, -370]], hideHands: true },
    gesture: { L: [[-66, -345], [-64, -270]], R: [[78, -350], [98, -408]] },
    point: { L: [[-66, -345], [-64, -270]], R: [[102, -428], [152, -446]] },
    wave: { L: [[-66, -345], [-64, -270]], R: [[94, -468], [102, -546]] },
    phone: { L: [[-60, -350], [-16, -372]], R: [[60, -350], [16, -372]], prop: 'phone' },
    tablet: { L: [[-60, -350], [-24, -370]], R: [[60, -350], [24, -370]], prop: 'tablet' },
    mug: { L: [[-66, -345], [-64, -270]], R: [[66, -345], [34, -384]], prop: 'mug' },
    plate: { L: [[-62, -350], [-30, -372]], R: [[62, -350], [30, -372]], prop: 'plate' },
    thinking: { L: [[-62, -362], [22, -382]], R: [[52, -384], [14, -466]] },
    shrug: { L: [[-92, -362], [-106, -412]], R: [[92, -362], [106, -412]] },
    clicker: { L: [[-66, -345], [-64, -270]], R: [[70, -348], [56, -300]], prop: 'clicker' },
    pocket: { L: [[-70, -350], [-54, -294]], R: [[70, -350], [54, -294]], hideHands: true },
    can: { L: [[-66, -345], [-64, -270]], R: [[72, -345], [70, -282]], prop: 'can' }
  };

  function arms(look, pose) {
    const P = POSES[pose] || POSES.down;
    const sleeve0 = look.top === 'apron' || look.top === 'tshirt' ? look.shirt : look.topColor;
    const shortSleeve = ['polo', 'apron', 'tshirt'].includes(look.top);
    const seg = (side) => {
      const dim = side === 'R' ? -0.1 : 0;
      const skin = shade(look.skin, dim), sleeve = shade(sleeve0, dim), fore = shortSleeve ? skin : sleeve, cuff = shade(sleeve, -0.12);
      const [sx, sy] = SH[side];
      const [[ex, ey], [wx, wy]] = P[side];
      const dx = wx - ex, dy = wy - ey, len = Math.hypot(dx, dy) || 1;
      const hx = wx + (dx / len) * 8, hy = wy + (dy / len) * 8;
      let s = '';
      if (shortSleeve) {
        s += `<path d="M${sx},${sy} L${ex},${ey}" stroke="${skin}" stroke-width="20" stroke-linecap="round" fill="none"/>`;
        const mx = sx + (ex - sx) * 0.45, my = sy + (ey - sy) * 0.45;
        s += `<path d="M${sx},${sy} L${mx},${my}" stroke="${sleeve}" stroke-width="26" stroke-linecap="round" fill="none"/>`;
      } else {
        s += `<path d="M${sx},${sy} L${ex},${ey}" stroke="${sleeve}" stroke-width="24" stroke-linecap="round" fill="none"/>`;
      }
      s += `<path d="M${ex},${ey} L${wx},${wy}" stroke="${fore}" stroke-width="19" stroke-linecap="round" fill="none"/>`;
      if (!shortSleeve) s += `<circle cx="${wx}" cy="${wy}" r="9.5" fill="${cuff}"/>`;
      if (!P.hideHands) s += `<circle cx="${hx}" cy="${hy}" r="10.5" fill="${skin}"/>`;
      return s;
    };
    let prop = '';
    switch (P.prop) {
      case 'phone': prop = `<rect x="-11" y="-398" width="22" height="36" rx="4" fill="#1b1d22"/><rect x="-9" y="-395" width="18" height="28" rx="2" fill="#4a6b8a" opacity=".7"/>`; break;
      case 'tablet': prop = `<rect x="-34" y="-410" width="68" height="48" rx="5" fill="#2a2d33"/><rect x="-30" y="-406" width="60" height="40" rx="2" fill="#9db7c9"/>`; break;
      case 'mug': prop = `<rect x="26" y="-410" width="24" height="28" rx="3" fill="${look.mug || '#f2efe8'}"/><path d="M50,-404 q10,0 10,8 q0,8 -10,8" stroke="${look.mug || '#f2efe8'}" stroke-width="4" fill="none"/>`; break;
      case 'plate': prop = `<ellipse cx="0" cy="-382" rx="52" ry="10" fill="#f4f1ea" stroke="#d8d2c6"/><ellipse cx="-16" cy="-388" rx="14" ry="6" fill="#c9a25a"/><ellipse cx="6" cy="-389" rx="14" ry="6" fill="#d6b06a"/><ellipse cx="24" cy="-387" rx="12" ry="5" fill="#c49b52"/>`; break;
      case 'clicker': prop = `<rect x="50" y="-302" width="12" height="22" rx="3" fill="#25272b"/>`; break;
      case 'can': prop = `<path d="M54,-284 L92,-284 L96,-246 L50,-246 Z" fill="#5b8a6e"/><path d="M92,-276 L124,-298" stroke="#5b8a6e" stroke-width="6" stroke-linecap="round"/><path d="M58,-284 Q73,-310 88,-284" stroke="#5b8a6e" stroke-width="4" fill="none"/>`; break;
    }
    // In "crossed" the right forearm sits over the left.
    return seg('L') + seg('R') + prop;
  }

  // ───────────────────────── Body

  function torso(look, id) {
    const top = look.top;
    const body = top === 'apron' || top === 'tshirt' ? look.shirt : look.topColor;
    const T = 'M-15,-462 L-46,-452 C-60,-448 -66,-438 -66,-424 L-60,-330 L-54,-262 L54,-262 L60,-330 L66,-424 C66,-438 60,-448 46,-452 L15,-462 Z';
    let fill = body, defs = '';
    if (top === 'flannel') {
      const pid = `plaid-${id}`;
      const c = look.check || shade(body, -0.35);
      defs = `<defs><pattern id="${pid}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${body}"/><rect width="22" height="6" fill="${c}" opacity=".45"/><rect width="6" height="22" fill="${c}" opacity=".45"/><rect x="14" width="2" height="22" fill="#fff" opacity=".15"/></pattern></defs>`;
      fill = `url(#${pid})`;
    }
    const dk = shade(body, -0.16);
    let s = defs + `<path d="${T}" fill="${fill}"/>`;
    const collar = (c) => `<path d="M-15,-462 L-3,-445 L1,-459 Z" fill="${c}"/><path d="M15,-462 L3,-445 L-1,-459 Z" fill="${c}"/>`;
    switch (top) {
      case 'shirt': case 'flannel':
        s += collar(shade(body, -0.08)) + `<path d="M0,-455 L0,-266" stroke="${dk}" stroke-width="1.4"/>` + [-420, -380, -340, -300].map(y => `<circle cx="3" cy="${y}" r="1.8" fill="${dk}"/>`).join('');
        break;
      case 'polo':
        s += collar(shade(body, -0.1)) + `<path d="M0,-455 L0,-418" stroke="${dk}" stroke-width="1.4"/><circle cx="2.5" cy="-440" r="1.6" fill="${dk}"/><circle cx="2.5" cy="-428" r="1.6" fill="${dk}"/>`;
        break;
      case 'tshirt': case 'apron':
        s += `<path d="M-14,-461 Q0,-448 14,-461" stroke="${dk}" stroke-width="2.5" fill="none"/>`;
        break;
      case 'sweater':
        s += `<path d="M-15,-461 Q0,-448 15,-461" stroke="${dk}" stroke-width="4" fill="none"/><rect x="-55" y="-278" width="110" height="16" fill="${shade(body, -0.08)}"/>`;
        if (look.shirt) s += `<path d="M-12,-460 L-4,-452 L0,-458 Z M12,-460 L4,-452 L0,-458 Z" fill="${look.shirt}"/>`;
        break;
      case 'hoodie':
        s += `<path d="M-28,-462 Q0,-436 28,-462 Q20,-476 0,-476 Q-20,-476 -28,-462 Z" fill="${shade(body, -0.1)}"/><path d="M-7,-448 L-8,-400 M7,-448 L8,-400" stroke="#eee" stroke-width="2"/><path d="M-40,-330 L40,-330 L36,-290 L-36,-290 Z" fill="${shade(body, -0.06)}"/>`;
        break;
      case 'blazer':
        s += `<path d="M-15,-462 L0,-388 L15,-462 Z" fill="${look.shirt}"/>` + collar(look.shirt) +
          `<path d="M-15,-462 L-25,-420 L-9,-410 L0,-388 M15,-462 L25,-420 L9,-410 L0,-388" stroke="${shade(body, -0.25)}" stroke-width="2" fill="none"/>` +
          `<circle cx="0" cy="-352" r="2.6" fill="${shade(body, -0.35)}"/><circle cx="0" cy="-322" r="2.6" fill="${shade(body, -0.35)}"/><path d="M28,-330 L48,-330" stroke="${shade(body, -0.2)}" stroke-width="2"/>`;
        break;
      case 'cardigan':
        s += `<path d="M-15,-462 L-2,-358 L2,-358 L15,-462 Z" fill="${look.shirt}"/>` + [-340, -315, -290].map(y => `<circle cx="-4" cy="${y}" r="2.2" fill="${shade(body, -0.3)}"/>`).join('') +
          `<path d="M-2,-358 L-4,-262 M2,-358 L4,-262" stroke="${dk}" stroke-width="1.5"/><rect x="-55" y="-274" width="110" height="12" fill="${shade(body, -0.08)}"/>`;
        break;
    }
    if (top === 'apron') {
      const a = look.apron;
      s += `<path d="M-34,-432 L34,-432 L41,-205 L-41,-205 Z" fill="${a}"/><path d="M-30,-432 L-14,-462 M30,-432 L14,-462" stroke="${a}" stroke-width="5"/>` +
        `<rect x="-26" y="-300" width="52" height="30" rx="3" fill="${shade(a, -0.12)}"/>`;
      if (look.badge) s += `<rect x="6" y="-424" width="32" height="13" rx="2" fill="#f6f2ea"/><text x="22" y="-414.5" font-size="8" font-family="Archivo, Arial, sans-serif" font-weight="700" text-anchor="middle" fill="#2b2b2b">${look.badge}</text>`;
    }
    if (look.lanyard) s += `<path d="M-12,-460 L0,-392 L12,-460" stroke="#1f3f8a" stroke-width="2.5" fill="none"/><rect x="-9" y="-394" width="18" height="24" rx="2" fill="#f4f4f2"/>`;
    s += `<path d="${T}" fill="url(#ppShadeX)"/><path d="${T}" fill="url(#ppShadeY)"/>` +
      `<path d="M-44,-452 C-58,-448 -64,-438 -64,-424 L-58,-330 L-52,-266" stroke="#fff" stroke-opacity=".2" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="0" cy="-458" rx="16" ry="5" fill="#000" opacity=".18"/>`;
    return s;
  }

  function legs(look) {
    const shoes = look.shoes || '#1d1e22';
    const shoe = `<path d="M-48,-18 L-8,-18 Q-4,-6 -8,0 L-54,0 Q-57,-10 -48,-18 Z" fill="${shoes}"/><path d="M48,-18 L8,-18 Q4,-6 8,0 L54,0 Q57,-10 48,-18 Z" fill="${shoes}"/>`;
    if (look.skirt) {
      const leg = shade(look.skin, -0.06);
      return `<path d="M-40,-160 L-38,-16 L-14,-16 L-12,-160 Z M40,-160 L38,-16 L14,-16 L12,-160 Z" fill="${leg}"/>` + shoe +
        `<path d="M-54,-264 L-68,-148 L68,-148 L54,-264 Z" fill="${look.skirt}"/>`;
    }
    const p = look.pants;
    const L = 'M-54,-262 L-50,-140 L-44,-16 L-10,-16 L-5,-140 L-1,-232 L1,-232 L5,-140 L10,-16 L44,-16 L50,-140 L54,-262 Z';
    return `<path d="${L}" fill="${p}"/><path d="${L}" fill="url(#ppShadeX)"/>` +
      `<path d="M-28,-230 L-27,-20 M28,-230 L27,-20" stroke="${shade(p, -0.15)}" stroke-width="1.2" opacity=".6"/>` +
      `<rect x="-55" y="-270" width="110" height="9" fill="${shade(p, -0.25)}"/>` + shoe;
  }

  function head(look) {
    const skin = look.skin, skinD = shade(skin, -0.14), lip = shade(skin, -0.5);
    const H = hair(look.hair, look.hairColor);
    const M = mouths(lip);
    const iris = look.iris || '#3b2a20';
    const face = 'M-27,-512 C-28,-548 28,-548 27,-512 C27,-492 18,-474 0,-470 C-18,-474 -27,-492 -27,-512 Z';
    let beard = '';
    if (look.facial === 'beard') {
      const bc = look.beardColor || look.hairColor;
      beard = `<path d="M-27,-506 C-27,-482 -14,-465 0,-463 C14,-465 27,-482 27,-506 C22,-489 12,-478 0,-478 C-12,-478 -22,-489 -27,-506 Z" fill="${bc}"/><path d="M-11,-489 Q0,-495 11,-489 Q0,-486 -11,-489 Z" fill="${bc}"/>`;
    } else if (look.facial === 'stubble') {
      beard = `<path d="M-26,-504 C-26,-482 -14,-467 0,-466 C14,-467 26,-482 26,-504 C20,-488 12,-480 0,-480 C-12,-480 -20,-488 -26,-504 Z" fill="${look.hairColor}" opacity=".22"/>`;
    }
    const brows = MOODS.map(m => {
      const [l, r] = BROWS_BY_MOOD[m];
      const st = `stroke="${shade(look.hairColor, -0.1)}" stroke-width="3.2" stroke-linecap="round" fill="none"`;
      return `<g class="b-${m}"><path d="${BROW[l]}" ${st}/><g transform="scale(-1,1)"><path d="${BROW[r]}" ${st}/></g></g>`;
    }).join('');
    const mouthAll = MOODS.map(m => `<g class="m-${m}">${M[m]}</g>`).join('');
    const glasses = look.glasses ? `<g fill="none" stroke="#2a2a2e" stroke-width="1.8"><rect x="-20" y="-515" width="17" height="13" rx="4"/><rect x="3" y="-515" width="17" height="13" rx="4"/><path d="M-3,-510 L3,-510 M-20,-510 L-27,-512 M20,-510 L27,-512"/></g>` : '';
    return {
      back: H.back,
      head: `<path d="M-10,-482 L-10,-456 Q0,-450 10,-456 L10,-482 Z" fill="${skinD}"/>` +
        `<ellipse cx="-27" cy="-506" rx="5" ry="9" fill="${skinD}"/><ellipse cx="27" cy="-506" rx="5" ry="9" fill="${skinD}"/>` +
        `<path d="${face}" fill="${skin}"/><path d="${face}" fill="url(#ppFace)"/>` +
        beard +
        `<g class="eyes"><g class="eyes-blink">` +
        `<ellipse cx="-11" cy="-508" rx="6" ry="4.1" fill="#fbf8f4"/><ellipse cx="11" cy="-508" rx="6" ry="4.1" fill="#fbf8f4"/>` +
        `<g class="irises"><circle cx="-11" cy="-508" r="3.3" fill="${iris}"/><circle cx="11" cy="-508" r="3.3" fill="${iris}"/><circle cx="-11" cy="-508" r="1.6" fill="#111"/><circle cx="11" cy="-508" r="1.6" fill="#111"/><circle cx="-10" cy="-509.3" r=".8" fill="#fff"/><circle cx="12" cy="-509.3" r=".8" fill="#fff"/></g>` +
        `<path d="M-17,-508.5 Q-11,-514 -5,-508.5 M17,-508.5 Q11,-514 5,-508.5" stroke="${shade(skin, -0.55)}" stroke-width="1.7" fill="none" stroke-linecap="round"/>` +
        `</g></g>` +
        `<path d="M-1,-506 Q-4,-494 -1,-492 Q2,-491 4,-493" stroke="${shade(skin, -0.25)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        `<g class="mouth">${mouthAll}<ellipse class="m-talk" cx="0" cy="-483" rx="6" ry="4.4" fill="${lip}"/></g>` +
        `<g class="blush"><ellipse cx="-16" cy="-493" rx="6" ry="3.4" fill="#e0645a"/><ellipse cx="16" cy="-493" rx="6" ry="3.4" fill="#e0645a"/></g>` +
        H.front +
        `<g class="brows">${brows}</g>` + glasses
    };
  }

  // A complete character. `pos` = { x, y (feet), s (scale), flip }.
  function actor(id, look, opts = {}) {
    const n = ++uid;
    const build = look.build || 1;
    const h = look.h || 1;
    const hd = head(look);
    const delay = ((n * 0.37) % 1.6).toFixed(2);
    return `<g class="actor" data-id="${id}" style="${actorTransform(opts)}">
      <g class="actor-flip" transform="scale(${opts.flip ? -1 : 1},1)">
      <g class="actor-body mood-${opts.mood || 'neutral'}" style="--d:-${delay}s">
        <ellipse class="shadow" cx="0" cy="0" rx="${78 * build}" ry="15" fill="url(#ppContact)"/>
        <g transform="scale(${h})">
          <g class="head-tilt">${hd.back}</g>
          <g transform="scale(${build},1)">${legs(look)}${torso(look, id + n)}</g>
          <g class="head-tilt head">${hd.head}</g>
          <g class="arms" transform="scale(${build},1)">${arms(look, opts.pose || 'down')}</g>
          <g class="speak" transform="translate(0,-582)"><rect x="-13" y="-10" width="5" height="16" rx="2.5"/><rect x="-2.5" y="-14" width="5" height="24" rx="2.5"/><rect x="8" y="-10" width="5" height="16" rx="2.5"/></g>
        </g>
      </g></g>
    </g>`;
  }

  function actorTransform(o) {
    return `transform: translate(${o.x || 0}px, ${o.y || 0}px) scale(${o.s || 1})`;
  }

  // The player, seen over the shoulder.
  const ots = `<g class="ots" aria-hidden="true"><path d="M20,900 C40,826 130,796 246,786 L286,772 C282,756 280,738 282,722 C266,700 262,660 278,636 C300,606 362,602 388,630 C404,650 404,692 390,718 C392,742 388,758 380,772 L424,786 C540,796 616,828 640,900 Z" fill="#1a1d23"/><path d="M282,640 C304,606 366,604 390,636 C360,626 316,626 286,652 Z" fill="#2b2f36"/></g>`;

  // ───────────────────────── Environments (1600 × 900)

  // Every set is a Blender render (tools/blender/render_envs.py); PP.envData says where people stand.

  const DEFS = `<defs>
    <linearGradient id="ppShadeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
    <linearGradient id="ppShadeY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <radialGradient id="ppFace" cx=".36" cy=".32" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
    <linearGradient id="scrGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="ppContact"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".6" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>`;

  function rendered(name) {
    const d = window.PP.envData && PP.envData[name];
    if (!d) return null;
    const img = l => d.layers.includes(l) ? `<image href="/img/env/${name}-${l}.webp?v=${PP.assetV}" x="0" y="0" width="1600" height="900" preserveAspectRatio="none"/>` : '';
    return { bg: img('bg'), mid: img('mid'), fg: img('fg'), cams: d.cams || {}, spots: d.spots || {} };
  }

  const EMPTY = { bg: '', mid: '', fg: '', cams: {}, spots: {} };
  function envFor(name) { return rendered(name) || EMPTY; }

  // Resolve a cast entry or move target ({ spot } or { x, y, s }) to coordinates.
  function place(envName, p) {
    const d = window.PP.envData && PP.envData[envName];
    if (p && p.spot && d && d.spots[p.spot]) {
      const sp = d.spots[p.spot];
      return { x: sp.x, y: sp.y, s: sp.s };
    }
    return { x: p.x, y: p.y, s: p.s };
  }

  // Live monitors. A scene can draw its own content onto a set's screens, in a 1000 × 562
  // space mapped onto each screen's projected corners (exported by the Blender render).
  const SCR_W = 1000, SCR_H = 562;
  // Paper on the desk (the rules card, the journal, the calendar) shows through: no screen behind it.
  const PAPER = new Set(['rules', 'journal', 'calendar']);
  const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function screenLayer(scene, ctx) {
    const d = window.PP.envData && PP.envData[scene.env];
    if (!d || !d.quads || !scene.screens) return '';
    return Object.entries(scene.screens).map(([k, draw]) => {
      const q = d.quads[k];
      if (!q) return '';
      // SVG can't do perspective, so fit the best flat mapping to all four corners
      // and clip to the true outline.
      const [tl, tr, br, bl] = q;
      const ax = (tr.x - tl.x + br.x - bl.x) / 2 / SCR_W, ay = (tr.y - tl.y + br.y - bl.y) / 2 / SCR_W;
      const cx = (bl.x - tl.x + br.x - tr.x) / 2 / SCR_H, cy = (bl.y - tl.y + br.y - tr.y) / 2 / SCR_H;
      const mx = (tl.x + tr.x + br.x + bl.x) / 4 - ax * SCR_W / 2 - cx * SCR_H / 2, my = (tl.y + tr.y + br.y + bl.y) / 4 - ay * SCR_W / 2 - cy * SCR_H / 2;
      const m = [ax, ay, cx, cy, mx, my].map(v => +v.toFixed(4)).join(' ');
      const id = `scr${++uid}`;
      return `<clipPath id="${id}"><polygon points="${q.map(p => `${p.x},${p.y}`).join(' ')}"/></clipPath>
        <g clip-path="url(#${id})"><g class="scr scr-${k}" transform="matrix(${m})">${PAPER.has(k) ? '' : `<rect x="-20" y="-20" width="${SCR_W + 40}" height="${SCR_H + 40}" fill="${k === 'clock' ? '#120f0c' : '#0a1012'}"/>`}${typeof draw === 'function' ? draw(ctx || {}) : draw}${k === 'center' ? '<g class="scr-alert"></g>' : ''}<rect width="${SCR_W}" height="${SCR_H}" fill="url(#scrGlass)"/></g></g>`;
    }).join('');
  }
  // The latest notification, as a bar across the top of the center screen.
  function screenAlert(text) {
    const t = text.length > 64 ? text.slice(0, 62) + '…' : text;
    return `<rect width="${SCR_W}" height="54" fill="#2a2110"/><circle cx="26" cy="27" r="7" fill="#d6a856"/><text x="46" y="36" font-family="${MONO}" font-size="24" fill="#f1e2c4">${esc(t)}</text>`;
  }

  // Full scene SVG: environment layers with actors placed in "far", "back" or "front".
  function sceneSvg(scene, people, moods = {}, label = '', ctx) {
    const env = envFor(scene.env);
    const layer = name => scene.cast.filter(c => (c.layer || 'back') === name).map(c => {
      const st = moods[c.id] || {};
      return actor(c.id, people[c.look || c.id].look, { ...place(scene.env, c), flip: c.flip, mood: st.mood || c.mood, pose: st.pose || c.pose });
    }).join('');
    const extras = (scene.extras || []).map(e => actor('extra', e.look, e)).join('');
    return {
      env,
      svg: `<svg class="stage-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${DEFS}
        <g class="world">${env.bg}<g class="layer-far">${layer('far')}</g>${env.mid}<g class="layer-back">${layer('back')}</g>${env.fg}${screenLayer(scene, ctx)}<g class="layer-front">${layer('front')}${extras}</g>${ots}</g>
      </svg>`
    };
  }

  return { actor, arms, sceneSvg, actorTransform, place, MOODS, shade, DEFS, screenAlert, esc, MONO };
})();
