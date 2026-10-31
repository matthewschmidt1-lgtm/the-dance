// Illustrated characters and environments, drawn as SVG.
// Characters are adults at roughly 8 heads tall, built from a look (skin, hair, clothing)
// plus a mood (brows, eyes, mouth, head tilt) and a pose (arm positions, held prop).
// Moods switch with CSS classes; poses re-render the arms group.
window.PP = window.PP || {};

PP.art = (function () {
  let uid = 0;
  // Bump when rendered images change, so browsers fetch the new files.
  PP.assetV = '3';

  const DOG = `<g class="dog-head">
    <path d="M-30,-6 C-46,0 -48,34 -36,44 C-30,30 -28,14 -24,4 Z" fill="#5a3f28"/>
    <path d="M30,-6 C46,0 48,34 36,44 C30,30 28,14 24,4 Z" fill="#5a3f28"/>
    <ellipse cx="0" cy="0" rx="34" ry="32" fill="#7a5a3a"/>
    <ellipse cx="0" cy="18" rx="20" ry="15" fill="#b08a62"/>
    <ellipse cx="0" cy="10" rx="8" ry="6" fill="#1d1712"/>
    <circle cx="-13" cy="-6" r="4.5" fill="#1d1712"/><circle cx="13" cy="-6" r="4.5" fill="#1d1712"/>
    <circle cx="-12" cy="-7.5" r="1.4" fill="#fff"/><circle cx="14" cy="-7.5" r="1.4" fill="#fff"/>
    <path d="M-6,26 Q0,32 6,26" stroke="#3a2a1c" stroke-width="2" fill="none"/>
  </g>`;

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

  const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;

  function rng(seed) {
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  function checkout() {
    const rand = rng(7);
    const pal = ['#b5523b', '#d9a441', '#4f7a5a', '#3f6c8c', '#c9c2a8', '#8a4b6b', '#e0d6c2', '#5d5f8a', '#a35f3a', '#7c8f4e', '#d36f4f', '#e8c56a'];
    let products = '';
    const boards = [262, 352, 442, 532];
    for (const by of boards) {
      let x = 0;
      while (x < 1600) {
        const w = 16 + rand() * 26, hh = 34 + rand() * 40;
        if (!(x > 175 && x < 345)) products += R(x.toFixed(0), (by - hh).toFixed(0), (w - 3).toFixed(0), hh.toFixed(0), pal[Math.floor(rand() * pal.length)], 'rx="2"');
        x += w;
      }
    }
    const bg = `
      ${R(0, 0, 1600, 900, '#e9e4d8')}
      ${R(0, 0, 1600, 96, '#d8d1c1')}
      ${[100, 380, 660, 940, 1220, 1500].map(x => R(x - 70, 40, 140, 10, '#fffbea', 'rx="3"') + R(x - 90, 36, 180, 18, '#fffbea', 'opacity=".25" rx="9"')).join('')}
      ${R(0, 150, 1600, 450, '#d3cbba')}
      ${boards.map(y => R(0, y, 1600, 9, '#a39b8b')).join('')}
      ${products}
      ${R(178, 150, 166, 450, '#e2dccd')}
      <path d="M178,600 L230,300 L292,300 L344,600 Z" fill="#cfc8b8"/>
      ${R(230, 250, 62, 50, '#cbc3b1')}
      <g>${R(198, 104, 128, 40, '#2f6a52', 'rx="4"')}<text x="262" y="131" font-size="20" font-weight="800" font-family="Archivo, Arial, sans-serif" text-anchor="middle" fill="#f2efe6" letter-spacing="2">AISLE 9</text></g>
      ${R(0, 600, 1600, 300, '#d9d4c9')}
      ${[652, 724, 812].map(y => R(0, y, 1600, 2, '#c7c1b5')).join('')}
      <g>${R(898, 0, 4, 116, '#8c8a85')}${R(856, 112, 88, 56, '#2f6a52', 'rx="6"')}<text x="900" y="152" font-size="34" font-weight="800" font-family="Archivo, Arial, sans-serif" text-anchor="middle" fill="#fff">4</text>${R(850, 106, 100, 68, '#7dffb5', 'opacity=".12" rx="10"')}</g>`;
    const fg = `
      ${R(300, 606, 1300, 32, '#c4c9cf')}
      ${R(300, 636, 1300, 264, '#56685e')}
      ${R(300, 662, 1300, 12, '#2f6a52')}
      ${R(300, 870, 1300, 30, '#3f4d45')}
      ${R(318, 590, 470, 20, '#26272a', 'rx="4"')}
      ${[360, 420, 480, 540, 600, 660, 720].map(x => R(x, 592, 2, 16, '#3a3b3f')).join('')}
      <g transform="translate(410,592)"><rect x="-26" y="-58" width="52" height="58" fill="#c8483a" rx="2"/><rect x="-20" y="-48" width="40" height="18" fill="#f2e3b5"/></g>
      <g transform="translate(480,592)"><path d="M-30,0 Q-26,-30 0,-34 Q-20,-24 -18,0 Z" fill="#e8c24a"/><path d="M-20,0 Q-12,-34 14,-34 Q-6,-24 -6,0 Z" fill="#f0cf5a"/></g>
      <g class="bottle" transform="translate(600,592)"><path d="M-15,0 L-15,-72 Q-15,-86 -6,-92 L-6,-108 L6,-108 L6,-92 Q15,-86 15,-72 L15,0 Z" fill="#3d6b38"/><rect x="-13" y="-62" width="26" height="30" fill="#efe6c8"/><rect x="-7" y="-116" width="14" height="10" fill="#b8902e"/><path d="M-9,-80 L-9,-6" stroke="#fff" stroke-opacity=".25" stroke-width="3"/></g>
      <g transform="translate(700,592)"><rect x="-18" y="-64" width="36" height="64" fill="#f3f3f0"/><path d="M-18,-64 L0,-80 L18,-64 Z" fill="#dfe6ee"/><rect x="-18" y="-44" width="36" height="16" fill="#4a7ec2"/></g>
      ${R(756, 520, 8, 88, '#4b4d52')}
      <g transform="translate(760,512)"><rect x="-20" y="-16" width="40" height="34" rx="5" fill="#24262b"/><rect x="-14" y="-10" width="28" height="12" rx="2" fill="#7fb8a3"/></g>
      ${R(1066, 516, 8, 92, '#4b4d52')}
      <g transform="translate(1070,470)"><rect x="-78" y="-46" width="156" height="92" rx="8" fill="#22262b"/><rect x="-70" y="-38" width="140" height="76" rx="4" fill="#0f1a14"/>
        <text x="-60" y="-14" font-size="13" font-family="JetBrains Mono, monospace" fill="#7cffb0" opacity=".8">OLIVE OIL 1L</text>
        <text class="reg-price" x="60" y="24" font-size="30" font-family="JetBrains Mono, monospace" font-weight="600" text-anchor="end" fill="#7cffb0">$11.99</text></g>`;
    return { bg, mid: '', fg, cams: { register: { x: 1070, y: 470, s: 2.6 }, belt: { x: 600, y: 540, s: 2.4 } } };
  }

  function desks(opts = {}) {
    const kitchen = opts.variant === 'kitchen';
    const skyline = [[640, 300], [720, 220], [800, 330], [870, 260], [960, 180], [1040, 300], [1120, 240], [1200, 320], [1290, 200], [1370, 280], [1450, 230], [1530, 300]]
      .map(([x, y]) => R(x, y, 70, 500 - y, '#9fb2c0')).join('');
    const bg = `
      ${R(0, 0, 1600, 900, '#e2e5e7')}
      ${R(0, 0, 1600, 60, '#d2d6d9')}
      ${[300, 800, 1300].map(x => R(x - 90, 20, 180, 14, '#fbfcf8', 'rx="3"')).join('')}
      <defs><linearGradient id="sky-office" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6dbe8"/><stop offset="1" stop-color="#eef3f5"/></linearGradient></defs>
      ${R(620, 80, 980, 420, 'url(#sky-office)')}
      ${skyline}
      ${[620, 780, 940, 1100, 1260, 1420, 1580].map(x => R(x, 80, 10, 420, '#59636b')).join('')}
      ${R(620, 76, 980, 10, '#59636b')}${R(620, 496, 980, 12, '#59636b')}
      ${R(40, 70, 520, 590, '#d3d8db')}
      ${R(110, 470, 260, 16, '#7b6a5a')}${R(130, 486, 10, 120, '#5c5048')}${R(340, 486, 10, 120, '#5c5048')}
      ${R(190, 400, 110, 70, '#2b3036', 'rx="4"')}
      <g transform="translate(470,560)"><rect x="-26" y="0" width="52" height="60" fill="#c7a27a"/><ellipse cx="-14" cy="-20" rx="20" ry="34" fill="#4f7d52"/><ellipse cx="14" cy="-28" rx="18" ry="40" fill="#5f9161"/></g>
      ${R(0, 640, 1600, 260, '#b9b4ab')}
      ${R(0, 640, 1600, 6, '#a7a299')}
      ${R(600, 556, kitchen ? 560 : 1000, 96, '#7d8b95')}
      ${R(600, 548, kitchen ? 560 : 1000, 10, '#6c7983')}
      ${[700, 960, ...(kitchen ? [] : [1250, 1460])].map(x => R(x, 492, 120, 60, '#1f2328', 'rx="4"')).join('')}
      ${kitchen ? `
        ${R(1180, 600, 420, 300, '#c9c3b8')}${R(1180, 588, 420, 16, '#e9e5dd')}
        ${[1200, 1340, 1480].map(x => R(x, 630, 120, 240, '#bdb6aa', 'rx="4"') + R(x + 50, 740, 20, 4, '#8e877b')).join('')}
        <g transform="translate(1290,588)"><rect x="-44" y="-112" width="88" height="112" rx="6" fill="#2c2f35"/><rect x="-32" y="-98" width="64" height="20" rx="3" fill="#4b6e8f"/><rect x="-18" y="-60" width="36" height="8" fill="#15171a"/><path d="M-20,-48 L20,-48 L16,-4 L-16,-4 Z" fill="#a8c2cf" opacity=".6"/><path d="M-16,-28 L16,-28 L16,-4 L-16,-4 Z" fill="#5a3a26" opacity=".85"/></g>
        <g transform="translate(1390,588)"><rect x="-12" y="-28" width="24" height="28" rx="3" fill="#e9e4da"/><rect x="18" y="-28" width="24" height="28" rx="3" fill="#c96a4a"/></g>
        ${R(1240, 230, 300, 240, '#cfd5d9', 'rx="4"')}<text x="1390" y="290" font-size="22" font-weight="800" font-family="Archivo, Arial, sans-serif" text-anchor="middle" fill="#5a6470">PLEASE RINSE</text><text x="1390" y="320" font-size="22" font-weight="800" font-family="Archivo, Arial, sans-serif" text-anchor="middle" fill="#5a6470">YOUR MUG</text><text x="1390" y="360" font-size="16" font-family="Archivo, Arial, sans-serif" text-anchor="middle" fill="#7b8590">— Management (3rd notice)</text>` : ''}`;
    const mid = `
      ${R(40, 70, 520, 590, '#bfe0ee', 'opacity=".2"')}
      <g fill="none" stroke="#6b757d" stroke-width="8">${R(40, 70, 520, 590, 'none', 'stroke="#6b757d" stroke-width="8"')}<path d="M300,70 L300,660"/></g>
      <path d="M80,620 L240,110 M140,640 L290,160 M340,620 L480,180" stroke="#fff" stroke-opacity=".28" stroke-width="10"/>
      ${R(282, 360, 8, 60, '#4a5259', 'rx="3"')}
      <text x="170" y="122" font-size="16" font-family="Archivo, Arial, sans-serif" font-weight="700" fill="#4a5259">E. MORROW</text>`;
    const fg = kitchen ? `
      <ellipse cx="300" cy="900" rx="330" ry="70" fill="#7c6450"/><ellipse cx="300" cy="884" rx="330" ry="64" fill="#8f7560"/>
      <g transform="translate(470,860)"><rect x="-18" y="-32" width="36" height="34" rx="4" fill="#f0ebe2"/><path d="M18,-24 q12,0 12,9 q0,9 -12,9" stroke="#f0ebe2" stroke-width="5" fill="none"/></g>` : `
      <path d="M0,768 L880,768 L960,900 L0,900 Z" fill="#8b6a4f"/>
      <path d="M0,768 L880,768 L888,782 L0,782 Z" fill="#a1805f"/>
      <g transform="translate(470,760)"><rect x="-14" y="-40" width="28" height="44" fill="#2a2e34"/><rect x="-60" y="-4" width="120" height="10" rx="4" fill="#2a2e34"/>
        <rect x="-180" y="-220" width="360" height="190" rx="10" fill="#1d2228"/><rect x="-168" y="-208" width="336" height="166" rx="4" fill="#f4f6f8"/>
        <text x="-150" y="-172" font-size="20" font-weight="800" font-family="Archivo, Arial, sans-serif" fill="#1d2228">HENLEY SUMMARY</text>
        <text x="-150" y="-140" font-size="16" font-family="JetBrains Mono, monospace" fill="#c0392b">Due Fri 12:00</text>
        <rect x="-150" y="-118" width="260" height="8" fill="#d5dbe1"/><rect x="-150" y="-100" width="220" height="8" fill="#d5dbe1"/><rect x="-150" y="-82" width="240" height="8" fill="#d5dbe1"/><rect x="-150" y="-64" width="120" height="8" fill="#d5dbe1"/></g>
      ${R(300, 800, 280, 34, '#2c3036', 'rx="6"')}
      <g transform="translate(720,810)"><rect x="-18" y="-34" width="36" height="38" rx="4" fill="#3f6c8c"/><path d="M18,-26 q12,0 12,10 q0,10 -12,10" stroke="#3f6c8c" stroke-width="5" fill="none"/></g>
      <g transform="translate(130,770)"><path d="M-30,0 L30,0 L24,60 L-24,60 Z" fill="#c26b4a"/><ellipse cx="-16" cy="-30" rx="16" ry="38" fill="#4f7d52"/><ellipse cx="10" cy="-44" rx="16" ry="48" fill="#5f9161"/><ellipse cx="26" cy="-20" rx="12" ry="30" fill="#4a7a4c"/></g>`;
    return { bg, mid, fg, cams: { monitor: { x: 470, y: 640, s: 2.3 }, sign: { x: 1390, y: 320, s: 2.4 } } };
  }

  function conference() {
    const bars = [[700, 0.55], [790, 0.8], [880, 0.42], [970, 0.95], [1060, 0.6]]
      .map(([x, v], i) => R(x + 30, (400 - v * 190).toFixed(0), 60, (v * 190).toFixed(0), i === 3 ? '#d1603d' : '#3f6c8c')).join('');
    const bg = `
      ${R(0, 0, 1600, 900, '#e6e2dc')}
      ${R(0, 540, 1600, 360, '#d6cfc4')}${R(0, 536, 1600, 8, '#c4bcaf')}
      ${R(60, 90, 360, 420, '#eef3f5')}
      ${Array.from({ length: 18 }, (_, i) => R(60, 98 + i * 23, 360, 6, '#cfd8dc')).join('')}
      ${R(56, 86, 368, 428, 'none', 'stroke="#8f8a82" stroke-width="8"')}
      ${R(640, 90, 780, 380, '#16191d', 'rx="8"')}
      ${R(652, 102, 756, 356, '#ffffff', 'rx="3"')}
      <text x="690" y="152" font-size="34" font-weight="800" font-family="Archivo, Arial, sans-serif" fill="#16191d">Regional Cost Analysis</text>
      <text x="690" y="184" font-size="18" font-family="Archivo, Arial, sans-serif" fill="#6b7280">Q3 freight cost by region</text>
      ${R(690, 400, 460, 3, '#c9cdd3')}
      ${bars}
      <text x="1200" y="250" font-size="16" font-family="Archivo, Arial, sans-serif" fill="#16191d">Q2 freight spike</text>
      <path d="M1196,256 L1102,232" stroke="#d1603d" stroke-width="3"/>
      <text x="1390" y="440" font-size="15" font-family="JetBrains Mono, monospace" text-anchor="end" fill="#6b7280">Prepared by J. Pike · v38</text>
      <g transform="translate(1520,540)"><rect x="-30" y="0" width="60" height="70" fill="#9c7b5f"/><ellipse cx="-12" cy="-40" rx="22" ry="50" fill="#4f7d52"/><ellipse cx="14" cy="-60" rx="20" ry="64" fill="#5f9161"/></g>
      ${R(600, 520, 160, 190, '#2b2f36', 'rx="18"')}
      ${R(220, 520, 160, 190, '#2b2f36', 'rx="18"')}`;
    const fg = `
      <path d="M0,650 L1120,650 L1210,900 L0,900 Z" fill="#6b4e3c"/>
      <path d="M0,650 L1120,650 L1128,668 L0,668 Z" fill="#83624b"/>
      <g transform="translate(330,650)"><path d="M-80,0 L80,0 L70,-110 L-70,-110 Z" fill="#c9ccd1"/><path d="M-74,-6 L74,-6 L65,-104 L-65,-104 Z" fill="#aeb3ba"/><circle cx="0" cy="-56" r="8" fill="#e8eaed"/></g>
      <g transform="translate(560,700)"><rect x="-60" y="-8" width="120" height="16" rx="2" fill="#f4f2ee" transform="rotate(-4)"/></g>
      <g transform="translate(860,690)"><rect x="-10" y="-40" width="22" height="40" rx="3" fill="#cfe6ef" opacity=".85"/></g>`;
    return { bg, mid: '', fg, cams: { screen: { x: 1030, y: 280, s: 1.6 }, footer: { x: 1300, y: 430, s: 3.4 } } };
  }

  function street() {
    const bg = `
      <defs><linearGradient id="sky-street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d4e6"/><stop offset="1" stop-color="#eef0e6"/></linearGradient></defs>
      ${R(0, 0, 1600, 900, 'url(#sky-street)')}
      ${[80, 260, 520, 760, 1000, 1240, 1480].map((x, i) => `<ellipse cx="${x}" cy="${370 + (i % 2) * 14}" rx="${130}" ry="60" fill="#a9c09a"/>`).join('')}
      ${R(-20, 210, 660, 510, '#cdb999')}
      <path d="M-50,220 L300,92 L670,220 Z" fill="#5b4a44"/>
      ${[[60, 330], [250, 330]].map(([x, y]) => R(x, y, 130, 120, '#f4efe4') + R(x + 10, y + 10, 110, 100, '#9fb8c6') + R(x + 63, y + 10, 4, 100, '#f4efe4')).join('')}
      ${R(460, 510, 100, 210, '#3f4f5f')}<circle cx="540" cy="616" r="5" fill="#d9c27a"/>
      ${R(440, 700, 140, 20, '#b9ad98')}
      <g transform="translate(745,700)">${R(-14, -200, 28, 200, '#6b5444')}<ellipse cx="0" cy="-250" rx="96" ry="90" fill="#6f9a62"/><ellipse cx="-50" cy="-210" rx="60" ry="56" fill="#628d57"/><ellipse cx="54" cy="-216" rx="62" ry="58" fill="#7aa66b"/></g>
      ${R(860, 240, 780, 460, '#a8b7ad')}
      <path d="M830,250 L1240,112 L1670,250 Z" fill="#4a4d55"/>
      ${Array.from({ length: 13 }, (_, i) => R(860, 262 + i * 34, 780, 2, '#98a79d')).join('')}
      ${R(1360, 320, 140, 120, '#f2efe9')}${R(1370, 330, 120, 100, '#90a9b8')}
      ${R(950, 452, 380, 26, '#f2efe9')}
      ${R(976, 478, 16, 210, '#f2efe9')}${R(1288, 478, 16, 210, '#f2efe9')}
      ${R(1076, 512, 92, 176, '#7a3e2e')}<circle cx="1152" cy="604" r="5" fill="#d9c27a"/>
      ${R(960, 680, 360, 22, '#d8d0c2')}${R(1080, 702, 100, 18, '#c8bfb0')}${R(1070, 720, 120, 14, '#bdb3a3')}
      ${Array.from({ length: 9 }, (_, i) => R(1196 + i * 10, 620, 4, 60, '#f2efe9')).join('')}${R(1192, 612, 96, 8, '#f2efe9')}
      <g transform="translate(1010,680)"><path d="M-20,0 L20,0 L16,-36 L-16,-36 Z" fill="#b5653f"/><circle cx="-8" cy="-50" r="16" fill="#5f9161"/><circle cx="8" cy="-56" r="14" fill="#7aa66b"/></g>
      ${R(0, 700, 1600, 22, '#8aa86e')}
      ${R(0, 720, 1600, 52, '#d9d5cd')}
      ${Array.from({ length: 16 }, (_, i) => R(i * 110, 720, 3, 52, '#c4bfb5')).join('')}
      ${R(0, 770, 1600, 14, '#bdb8ae')}
      ${R(0, 784, 1600, 116, '#5f6266')}
      ${Array.from({ length: 8 }, (_, i) => R(40 + i * 220, 856, 120, 6, '#e7e2d3', 'opacity=".55"')).join('')}`;
    const fg = `
      <ellipse cx="630" cy="846" rx="320" ry="22" fill="#000" opacity=".2"/>
      <g class="truck">
        ${R(352, 690, 274, 112, '#8a2f2a', 'rx="6"')}${R(352, 682, 274, 14, '#a3403a', 'rx="4"')}
        <path d="M620,804 L620,640 Q628,606 680,602 L792,602 Q826,608 846,660 L904,692 Q912,700 912,720 L912,804 Z" fill="#8a2f2a"/>
        <path d="M640,688 L644,630 Q650,618 680,616 L756,616 L756,688 Z" fill="#a9c3cf"/><path d="M768,616 L790,616 Q814,620 828,664 L832,688 L768,688 Z" fill="#a9c3cf"/>
        <path d="M762,612 L762,800" stroke="#6d2420" stroke-width="3"/>${R(720, 712, 30, 6, '#5f1d1a', 'rx="3"')}
        ${R(884, 712, 30, 18, '#f3e3a1', 'rx="4"')}${R(340, 770, 50, 18, '#9aa0a6', 'rx="4"')}${R(880, 776, 44, 18, '#9aa0a6', 'rx="4"')}
        <circle cx="470" cy="806" r="46" fill="#1d1e20"/><circle cx="470" cy="806" r="19" fill="#9aa0a6"/>
        <circle cx="826" cy="806" r="46" fill="#1d1e20"/><circle cx="826" cy="806" r="19" fill="#9aa0a6"/>
      </g>`;
    return { bg, mid: '', fg, cams: { truck: { x: 630, y: 720, s: 1.8 }, porch: { x: 1130, y: 560, s: 1.9 } } };
  }

  function yard() {
    const rand = rng(21);
    let planks = '';
    for (let x = 0, i = 0; x < 1600; x += 34, i++) {
      if (i === 30) continue; // a missing plank
      const lean = (Math.sin(i * 0.45) * 2.4 + (i % 7 === 0 ? 4 : 0)).toFixed(2);
      const c = ['#a07c5a', '#957253', '#a9865f', '#8f6c4f'][Math.floor(rand() * 4)];
      planks += `<rect x="${x}" y="402" width="30" height="244" fill="${c}" transform="rotate(${lean} ${x + 15} 646)"/><path d="M${x + 15},402 l-15,-14 l0,14 Z" fill="${c}" transform="rotate(${lean} ${x + 15} 646)"/>`;
    }
    const bg = `
      <defs><linearGradient id="sky-yard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6e6"/><stop offset="1" stop-color="#f0efe4"/></linearGradient></defs>
      ${R(0, 0, 1600, 900, 'url(#sky-yard)')}
      ${[180, 520, 900, 1200].map(x => `<ellipse cx="${x}" cy="330" rx="150" ry="90" fill="#86a978"/>`).join('')}
      ${R(1290, 130, 360, 520, '#a8b7ad')}${Array.from({ length: 15 }, (_, i) => R(1290, 146 + i * 34, 360, 2, '#98a79d')).join('')}
      ${R(1360, 220, 140, 130, '#f2efe9')}${R(1370, 230, 120, 110, '#90a9b8')}
      ${R(-20, 160, 230, 490, '#cdb999')}${R(40, 250, 110, 120, '#f4efe4')}${R(50, 260, 90, 100, '#9fb8c6')}
      ${R(0, 560, 1600, 340, '#93ae72')}
      ${Array.from({ length: 6 }, (_, i) => R(0, 600 + i * 50, 1600, 22, '#8aa56a')).join('')}
      <g class="dog" transform="translate(1180,388)">${DOG}</g>`;
    const mid = `
      ${planks}
      ${R(0, 452, 1600, 14, '#7f6145', 'transform="rotate(.6 800 460)"')}
      ${R(0, 590, 1600, 14, '#7f6145')}
      <ellipse cx="1166" cy="404" rx="12" ry="8" fill="#7a5a3a"/><ellipse cx="1196" cy="404" rx="12" ry="8" fill="#7a5a3a"/>`;
    const fg = `
      <path d="M40,760 Q240,720 460,768 L470,840 Q250,800 30,836 Z" fill="#6b4f3a"/>
      ${[[90, 760], [150, 748], [210, 744], [280, 748], [350, 754], [420, 762]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="#5f9161"/><circle cx="${x + 6}" cy="${y - 14}" r="6" fill="#e0b34a"/>`).join('')}`;
    return { bg, mid, fg, cams: { fence: { x: 800, y: 540, s: 1.5 }, dog: { x: 1180, y: 410, s: 2.8 }, garden: { x: 250, y: 760, s: 2 } } };
  }

  const FALLBACK_SPOTS = {
    checkout: { maya: { x: 840, y: 880, s: 1 }, dev: { x: 262, y: 640, s: 0.55 }, dev_near: { x: 640, y: 880, s: 0.98 }, sigh: { x: 1250, y: 960, s: 1.08 } },
    desks: { dana_start: { x: 1460, y: 880, s: 1 }, dana: { x: 1020, y: 880, s: 1 }, ellen_office: { x: 170, y: 640, s: 0.68 }, ellen_out: { x: 840, y: 870, s: 0.92 } },
    kitchen: { priya: { x: 640, y: 880, s: 1 }, marcus: { x: 1040, y: 880, s: 1.04 }, ellen_office: { x: 170, y: 640, s: 0.68 }, ellen_out: { x: 840, y: 870, s: 0.92 }, tom: { x: 1380, y: 760, s: 0.72 } },
    conference: { jordan: { x: 1330, y: 880, s: 1 }, ellen: { x: 680, y: 930, s: 0.95 }, dana: { x: 300, y: 930, s: 0.93 } },
    street: { gary: { x: 1130, y: 700, s: 0.82 }, ruth: { x: 740, y: 760, s: 0.68 } },
    yard: { gary: { x: 1000, y: 870, s: 1 }, ruth: { x: 380, y: 640, s: 0.55 } }
  };

  const ENVS = { checkout, desks, kitchen: () => desks({ variant: 'kitchen' }), conference, street, yard };

  const DEFS = `<defs>
    <linearGradient id="ppShadeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
    <linearGradient id="ppShadeY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <radialGradient id="ppFace" cx=".36" cy=".32" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
    <radialGradient id="ppContact"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".6" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>`;

  // Rendered Blender sets, when present, replace the drawn ones.
  function rendered(name) {
    const d = window.PP.envData && PP.envData[name];
    if (!d) return null;
    const img = l => d.layers.includes(l) ? `<image href="/img/env/${name}-${l}.webp?v=${PP.assetV}" x="0" y="0" width="1600" height="900" preserveAspectRatio="none"/>` : '';
    let far = '', midX = '', fgX = '';
    if (name === 'checkout' && d.points && d.points.reg) {
      const { x, y } = d.points.reg, w = d.points.reg_w || 80;
      fgX = `<text x="${x - w * 0.42}" y="${y - w * 0.15}" font-size="${(w * 0.075).toFixed(1)}" font-family="JetBrains Mono, monospace" fill="#7cffb0" opacity=".75">OLIVE OIL 1L</text>
        <text class="reg-price" x="${x + w * 0.42}" y="${y + w * 0.12}" font-size="${(w * 0.2).toFixed(1)}" font-family="JetBrains Mono, monospace" font-weight="600" text-anchor="end" fill="#7cffb0">$11.99</text>`;
    }
    if (name === 'yard' && d.points && d.points.dog) {
      const ppm = d.points.dog.s * 560 / 1.72;
      const sc = (0.42 * ppm) / 68;
      const p = d.points.paws;
      far = `<g transform="translate(${p.x},${p.y - 0.16 * ppm}) scale(${sc.toFixed(3)})">${DOG}</g>`;
      midX = `<g transform="translate(${p.x},${p.y}) scale(${sc.toFixed(3)})"><ellipse cx="-16" cy="2" rx="12" ry="8" fill="#7a5a3a"/><ellipse cx="16" cy="2" rx="12" ry="8" fill="#7a5a3a"/></g>`;
    }
    return { bg: img('bg') + far, mid: img('mid') + midX, fg: img('fg') + fgX, cams: d.cams || {}, spots: d.spots || {} };
  }

  function envFor(name, opts) { return rendered(name) || ENVS[name](opts || {}); }

  // Resolve a cast entry or move target ({ spot } or { x, y, s }) to coordinates.
  function place(envName, p) {
    const d = window.PP.envData && PP.envData[envName];
    if (p && p.spot && d && d.spots[p.spot]) {
      const sp = d.spots[p.spot];
      return { x: sp.x, y: sp.y, s: sp.s };
    }
    const fb = p && p.spot && FALLBACK_SPOTS[envName] && FALLBACK_SPOTS[envName][p.spot];
    return fb ? { ...fb } : { x: p.x, y: p.y, s: p.s };
  }

  // Full scene SVG: environment layers with actors placed in "far", "back" or "front".
  function sceneSvg(scene, people, moods = {}, label = '') {
    const env = envFor(scene.env, scene.envOpts);
    const layer = name => scene.cast.filter(c => (c.layer || 'back') === name).map(c => {
      const st = moods[c.id] || {};
      return actor(c.id, people[c.look || c.id].look, { ...place(scene.env, c), flip: c.flip, mood: st.mood || c.mood, pose: st.pose || c.pose });
    }).join('');
    const extras = (scene.extras || []).map(e => actor('extra', e.look, e)).join('');
    return {
      env,
      svg: `<svg class="stage-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${DEFS}
        <g class="world">${env.bg}<g class="layer-far">${layer('far')}</g>${env.mid}<g class="layer-back">${layer('back')}</g>${env.fg}<g class="layer-front">${layer('front')}${extras}</g>${ots}</g>
      </svg>`
    };
  }

  return { actor, arms, sceneSvg, actorTransform, place, MOODS, shade, DEFS };
})();
