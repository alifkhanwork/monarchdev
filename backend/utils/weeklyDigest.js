const { Resend } = require('resend');
const { localDateKey } = require('./statHistory');
const { deriveForPeriod } = require('./dailyMetricLog');

function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta, 12);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function buildWeekWindow(todayKey = localDateKey()) {
  // Last 7 calendar days ending yesterday (full days only)
  const end = addDays(todayKey, -1);
  const start = addDays(end, -6);
  const keys = [];
  for (let i = 0; i < 7; i++) keys.push(addDays(start, i));
  return { start, end, keys };
}

function summarizeCompletionLog(user, weekKeys) {
  const map = new Map((user.dayCompletionLog || []).map((e) => [e.date, e.status]));
  let complete = 0;
  let incomplete = 0;
  let frozen = 0;
  let missing = 0;
  for (const k of weekKeys) {
    const s = map.get(k);
    if (s === 'complete') complete += 1;
    else if (s === 'incomplete') incomplete += 1;
    else if (s === 'frozen') frozen += 1;
    else missing += 1;
  }
  return { complete, incomplete, frozen, missing };
}

function estimateExpFromHistory(user, weekKeys) {
  const hist = user.statHistory || [];
  const inWeek = hist.filter((h) => weekKeys.includes(h.date) && h.currentExp != null);
  if (inWeek.length < 2) return null;
  // Rough signal: level-ups * typical bar + exp delta (not exact awarded EXP)
  const first = inWeek[0];
  const last = inWeek[inWeek.length - 1];
  const levelGain = (last.level || 0) - (first.level || 0);
  return {
    levelGain,
    note: levelGain > 0 ? `Leveled up ${levelGain}× this week` : 'No level-ups logged this week',
  };
}

async function buildDigestPayload(user) {
  const { start, end, keys } = buildWeekWindow();
  const completion = summarizeCompletionLog(user, keys);
  const weekly = await deriveForPeriod('weekly');
  const expSignal = estimateExpFromHistory(user, keys);
  const streak = {
    current: user.currentStreak || 0,
    best: Math.max(user.bestStreak || 0, user.currentStreak || 0),
  };

  return {
    username: user.username || 'Hunter',
    weekLabel: `${start} → ${end}`,
    completion,
    streak,
    weeklyMissions: {
      workouts: `${weekly.workouts || 0}/5`,
      recovery: `${weekly.recoveryDays || 0}/2`,
      splitLabel: 'UL × PPL',
    },
    expSignal,
    level: user.level,
    totalPowerHint: null,
  };
}

function renderDigestHtml(payload, appUrl) {
  const c = payload.completion;
  const missed = c.incomplete + c.missing;
  const expLine = payload.expSignal
    ? payload.expSignal.note
    : 'EXP detail needs a few more history snapshots — streak & clears below.';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Weekly Hunter Digest</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#0b1220;padding:20px 24px;">
            <div style="color:#67e8f9;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">The Dev Monarch</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">Weekly Hunter Digest</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${payload.weekLabel}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Hey <strong>${payload.username}</strong> — here’s your week in The System.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
              <tr>
                <td style="width:50%;padding:10px;background:#f8fafc;border-radius:8px;">
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Streak</div>
                  <div style="font-size:28px;font-weight:700;color:#0e7490;">${payload.streak.current}</div>
                  <div style="font-size:12px;color:#64748b;">Best ${payload.streak.best} · Lv ${payload.level}</div>
                </td>
                <td style="width:12px;"></td>
                <td style="width:50%;padding:10px;background:#f8fafc;border-radius:8px;">
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Day clears</div>
                  <div style="font-size:28px;font-weight:700;color:#059669;">${c.complete}</div>
                  <div style="font-size:12px;color:#64748b;">Missed ${missed} · Frozen ${c.frozen}</div>
                </td>
              </tr>
            </table>
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;">
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Weekly missions</div>
              <div style="font-size:14px;line-height:1.6;">
                Workouts <strong>${payload.weeklyMissions.workouts}</strong><br/>
                Recovery <strong>${payload.weeklyMissions.recovery}</strong><br/>
                Split <strong>${payload.weeklyMissions.splitLabel}</strong>
              </div>
            </div>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">${expLine}</p>
            <a href="${appUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:8px;">Open The System</a>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;line-height:1.4;">
              You’re receiving this because weekly digests are enabled in Settings. Opt out anytime there.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWeeklyDigest(user) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  const to = (user.email || '').trim();
  if (!to) {
    return { skipped: true, reason: 'no_email' };
  }
  if (user.settings?.weeklyDigestEnabled === false) {
    return { skipped: true, reason: 'opted_out' };
  }

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://thedevmonarch.vercel.app';
  const from = process.env.DIGEST_FROM_EMAIL || 'The Dev Monarch <onboarding@resend.dev>';
  const payload = await buildDigestPayload(user);
  const html = renderDigestHtml(payload, appUrl);

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: [to],
    subject: `Hunter Digest · streak ${payload.streak.current} · ${payload.completion.complete}/7 clears`,
    html,
  });

  return { skipped: false, id: result?.data?.id || null, payload };
}

module.exports = {
  buildWeekWindow,
  buildDigestPayload,
  renderDigestHtml,
  sendWeeklyDigest,
};
