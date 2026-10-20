/* ============================================
   Gossip Folks — Gossip Type Indicator (GTI)
   Scoring: each answer is -2..+2 (Strongly Disagree
   to Strongly Agree). Scores are summed per axis
   (motive, discretion, role) across that axis's 7
   questions, then the sign of each axis total picks
   a pole. The 3 poles combine into one of 8 types.
   ============================================ */

(function () {
  'use strict';

  const SCORE_MAP = {
    'strongly-disagree': -2,
    disagree: -1,
    neutral: 0,
    agree: 1,
    'strongly-agree': 2,
  };

  // Polarity convention (set when the questions were written):
  // Strongly Agree leans Concern / Public / Active.
  // Strongly Disagree leans Entertainment / Private / Passive.
  // A tie (axis total === 0) defaults to the positive pole —
  // change the comparison in poleFor() to flip that default.
  const TYPES = {
    protector: {
      name: 'The Protector',
      image: 'gossip-type-protector.png',
      description:
        "Okay, let's get into it: you're The Protector. Somebody could be going through the worst week of their life and your first move isn't to spread it, it's to check in. Annoyingly mature of you.",
      impact:
        "People trust you with the hard stuff because you've earned it. Just don't let \u201cprotecting\u201d quietly turn into deciding, on someone else's behalf, who gets to know. Not every secret is yours to keep.",
    },
    confidant: {
      name: 'The Confidant',
      image: 'gossip-type-confidant.png',
      description:
        "You're The Confidant, and honestly, people clock this about you fast. Something happens and it ends up in your DMs, not the group chat. You collect secrets and somehow never trade a single one.",
      impact:
        "That's a real skill, truly. The catch: everyone handing you their business means you're carrying a lot nobody else can see. Make sure someone's holding space for you too.",
    },
    auntie: {
      name: 'The Auntie',
      image: 'gossip-type-auntie.png',
      description:
        "We need to talk about The Auntie energy you've got going on. You hear one thing and suddenly it's an announcement \u2014 \u201cI'm just worried about her,\u201d said to literally everyone at the cookout. The concern is real. The volume is a choice.",
      impact:
        "Your heart's genuinely in the right place, and people know that about you. Still \u2014 worry broadcast to the whole family is still, technically, gossip. Food for thought.",
    },
    observer: {
      name: 'The Observer',
      image: 'gossip-type-concerned-observer.png',
      description:
        "You're The Observer: deeply invested in everyone's business, surgically uninvolved in everyone's business. You'll read every post, screenshot nothing, say nothing, and somehow still have thoughts.",
      impact:
        "Your concern is real, even quiet. Just know that watching from the sidelines forever can start to look like you don't care, when really, you're just built private.",
    },
    spiller: {
      name: 'The Spiller',
      image: 'gossip-type-grapevine.png',
      description:
        "The Spiller, ladies and gentlemen. Gossip is basically your love language \u2014 you trade it one-on-one, quick and discreet, and you're genuinely good at it. A professional, really.",
      impact:
        "People love confiding in you because you make it fun. Just remember: \u201cI only told one person\u201d adds up fast when everyone's doing the same math.",
    },
    lurker: {
      name: 'The Lurker',
      image: 'gossip-type-lurker.png',
      description:
        "You're The Lurker. You absorb everything \u2014 every vague post, every \u201cwe need to talk\u201d someone almost sent \u2014 and repeat none of it. Nobody knows how you know things. You just know.",
      impact:
        "People can talk around you and trust it stays there, which is genuinely rare. Just don't disappear into the quiet so much that no one actually knows where you stand on anything.",
    },
    host: {
      name: 'The TV/Radio Host',
      image: 'gossip-type-talk-show-host.png',
      description:
        "You're The TV/Radio Host \u2014 gossip isn't a guilty pleasure for you, it's a whole broadcast. You've got the updates, the delivery, the audience. Honestly, give yourself a segment.",
      impact:
        "You keep things lively, and people come to you for \u201cwhat'd I miss.\u201d Just know broadcasting to a crowd means you lose control of the story the second it leaves your hands.",
    },
    spectator: {
      name: 'The Spectator',
      image: 'gossip-type-spectator.png',
      description:
        "The Spectator has entered the chat \u2014 to watch, not to participate. Celebrity drama, influencer meltdowns, the group chat's latest: you're locked in. You're just not the one typing.",
      impact:
        "Enjoying the show without being part of the mess? Smart, honestly. Just don't let \u201cjust watching\u201d become your excuse to check out when people around you actually need you to show up.",
    },
  };

  // Maps a (motive, discretion, role) pole combination to a type id.
  // 'positive' = Concern / Public / Active, 'negative' = the opposite pole.
  const TYPE_GRID = {
    'positive-negative-positive': 'protector', // concern, private, active
    'positive-negative-negative': 'confidant', // concern, private, passive
    'positive-positive-positive': 'auntie', // concern, public, active
    'positive-positive-negative': 'observer', // concern, public, passive
    'negative-negative-positive': 'spiller', // entertainment, private, active
    'negative-negative-negative': 'lurker', // entertainment, private, passive
    'negative-positive-positive': 'host', // entertainment, public, active
    'negative-positive-negative': 'spectator', // entertainment, public, passive
  };

  // Each axis sums 7 questions at -2..+2, so totals range -14..+14.
  // positiveLabel is the pole Strongly Agree leans toward.
  const AXES = [
    { key: 'motive', negativeLabel: 'Entertainment', positiveLabel: 'Concern' },
    { key: 'discretion', negativeLabel: 'Private', positiveLabel: 'Public' },
    { key: 'role', negativeLabel: 'Passive', positiveLabel: 'Active' },
  ];

  const AXIS_MIN = -14;
  const AXIS_MAX = 14;

  function axisStrengthLabel(absScore) {
    if (absScore === 0) return null; // handled as a tie, see axisSummaryText
    if (absScore <= 4) return 'Slightly leans';
    if (absScore <= 9) return 'Leans';
    return 'Strongly leans';
  }

  function axisSummaryText(score, negativeLabel, positiveLabel) {
    if (score === 0) {
      return `Right in the middle of ${negativeLabel} and ${positiveLabel}`;
    }
    const strength = axisStrengthLabel(Math.abs(score));
    const pole = score > 0 ? positiveLabel : negativeLabel;
    return `${strength} ${pole}`;
  }

  function axisMarkerPercent(score) {
    const clamped = Math.max(AXIS_MIN, Math.min(AXIS_MAX, score));
    return ((clamped - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;
  }

  function buildAxisBreakdownHTML(totals) {
    const rows = AXES.map((axis) => {
      const score = totals[axis.key];
      const percent = axisMarkerPercent(score);
      const summary = axisSummaryText(score, axis.negativeLabel, axis.positiveLabel);

      return `
        <div class="axis-row">
          <div class="axis-labels">
            <span>${axis.negativeLabel}</span>
            <span>${axis.positiveLabel}</span>
          </div>
          <div class="axis-track">
            <div class="axis-marker" style="left: ${percent}%;"></div>
          </div>
          <p class="axis-summary">${summary}</p>
        </div>
      `;
    });

    return `<div class="axis-breakdown">${rows.join('')}</div>`;
  }

  function scoreQuiz(form) {
    const totals = { motive: 0, discretion: 0, role: 0 };
    const fieldsets = form.querySelectorAll('fieldset[data-axis]');

    fieldsets.forEach((fieldset) => {
      const axis = fieldset.dataset.axis;
      const checked = fieldset.querySelector('input[type="radio"]:checked');
      if (checked && axis in totals) {
        totals[axis] += SCORE_MAP[checked.value] ?? 0;
      }
    });

    return totals;
  }

  function poleFor(score) {
    // Tie (score === 0) defaults to the positive pole. Flip to `score > 0`
    // if ties should lean Entertainment / Private / Passive instead.
    return score >= 0 ? 'positive' : 'negative';
  }

  function getTypeId(totals) {
    const key = [
      poleFor(totals.motive),
      poleFor(totals.discretion),
      poleFor(totals.role),
    ].join('-');

    return TYPE_GRID[key];
  }

  function renderResult(typeId, totals) {
    const type = TYPES[typeId];
    const container = document.getElementById('gossip-type-result');
    if (!type || !container) return;

    container.classList.remove('result-pending');

    // Announce the reveal to screen readers, and make the container a
    // valid focus target so keyboard users land here, not wherever
    // focus happened to be before the scroll.
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('tabindex', '-1');

    container.innerHTML = `
      <img src="${type.image}" alt="Illustrated character representing ${type.name} archetype" id="result-type-image" class="result-type-image">
      <h3 id="result-type-name">${type.name}</h3>
      <p id="result-type-description">${type.description}</p>
      <p id="result-type-impact">${type.impact}</p>
      ${buildAxisBreakdownHTML(totals)}
    `;

    // Re-trigger the reveal animation even on a retake: removing then
    // re-adding the class in the same tick doesn't restart a CSS
    // animation, so force a reflow in between.
    container.classList.remove('result-revealed');
    void container.offsetWidth;
    container.classList.add('result-revealed');
  }

  function handleSubmit(event) {
    // The browser already blocks this event from firing if any
    // `required` radio group is unanswered, showing its own native
    // prompt and scrolling to the first invalid question — so by the
    // time this runs, every question has an answer.
    event.preventDefault();

    const form = event.target;
    const totals = scoreQuiz(form);
    const typeId = getTypeId(totals);

    renderResult(typeId, totals);

    const resultsSection = document.querySelector('.gossip-results');
    if (resultsSection) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      resultsSection.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    // Move focus to the result itself once the scroll has had a moment
    // to start, so keyboard and screen reader users land on the new
    // content rather than staying wherever focus was in the form.
    const resultContainer = document.getElementById('gossip-type-result');
    if (resultContainer) {
      window.setTimeout(() => resultContainer.focus(), 50);
    }
  }

  function init() {
    const form = document.getElementById('gossip-quiz-form');
    if (!form) return;
    form.addEventListener('submit', handleSubmit);
  }

  document.addEventListener('DOMContentLoaded', init);
})();