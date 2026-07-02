import React, { useState, useMemo } from "react";
import { Calculator, Lock, Check, X, Sparkles, ChevronRight, User, LogOut, Crown } from "lucide-react";

function tokenizeAndEval(expr) {
  const clean = expr.replace(/\s+/g, "");
  if (!/^[0-9+\-*/^().]+$/.test(clean)) return null;
  try {
    const jsExpr = clean.replace(/\^/g, "**");
    const val = Function(`"use strict"; return (${jsExpr});`)();
    if (typeof val !== "number" || !isFinite(val)) return null;
    return val;
  } catch {
    return null;
  }
}

function solveLinear(question) {
  const q = question.replace(/\s+/g, "");
  const eqMatch = q.match(/^(.+)=(.+)$/);
  if (!eqMatch) return null;
  const [_, lhsRaw, rhsRaw] = eqMatch;

  function parseSide(side) {
    const terms = side.match(/[+-]?[^+-]+/g) || [];
    let a = 0, b = 0;
    for (let t of terms) {
      if (t.includes("x")) {
        let coeff = t.replace("x", "");
        if (coeff === "" || coeff === "+") coeff = "1";
        if (coeff === "-") coeff = "-1";
        const val = tokenizeAndEval(coeff);
        if (val === null) return null;
        a += val;
      } else {
        const val = tokenizeAndEval(t);
        if (val === null) return null;
        b += val;
      }
    }
    return { a, b };
  }

  const left = parseSide(lhsRaw);
  const right = parseSide(rhsRaw);
  if (!left || !right || (left.a === 0 && right.a === 0)) return null;

  const steps = [];
  steps.push(`Start: ${lhsRaw} = ${rhsRaw}`);

  const A = left.a - right.a;
  const B = right.b - left.b;
  steps.push(`Move x-terms to one side, constants to the other: ${A}x = ${B}`);

  if (A === 0) return null;
  const x = B / A;
  steps.push(`Divide both sides by ${A}: x = ${B} / ${A}`);
  steps.push(`x = ${Number(x.toFixed(6)).toString()}`);

  return { steps, result: `x = ${Number(x.toFixed(6)).toString()}` };
}

function solveExpression(question) {
  const trimmed = question.trim();
  if (!trimmed) return { steps: [], result: null, error: "Enter a question first." };

  if (trimmed.includes("=") && /x/i.test(trimmed)) {
    const linear = solveLinear(trimmed);
    if (linear) return { steps: linear.steps, result: linear.result, error: null };
    return { steps: [], result: null, error: "This equation form isn't supported yet — try a linear equation like 2x + 3 = 7." };
  }

  const val = tokenizeAndEval(trimmed);
  if (val !== null) {
    const steps = [
      `Start: ${trimmed}`,
      `Apply order of operations (parentheses, exponents, × ÷, + −)`,
      `Result: ${Number(val.toFixed(6)).toString()}`,
    ];
    return { steps, result: Number(val.toFixed(6)).toString(), error: null };
  }

  return { steps: [], result: null, error: "Couldn't parse that. Try an arithmetic expression (2*(3+4)) or a linear equation (2x+3=7)." };
}

const FREE_DAILY_LIMIT = 6;

export default function MathsSolutionFinder() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [solvesUsedToday, setSolvesUsedToday] = useState(0);
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(false);

  const remaining = useMemo(
    () => Math.max(0, FREE_DAILY_LIMIT - solvesUsedToday),
    [solvesUsedToday]
  );

  function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    if (!authEmail.includes("@") || authPassword.length < 4) {
      setAuthError("Enter a valid email and a password of at least 4 characters.");
      return;
    }
    setUser({ email: authEmail, plan: "free" });
    setAuthMode(null);
    setAuthEmail("");
    setAuthPassword("");
  }

  function handleLogout() {
    setUser(null);
    setSolvesUsedToday(0);
    setSolution(null);
    setQuestion("");
  }

  function handleSolve() {
    if (!user) {
      setAuthMode("signup");
      return;
    }
    if (user.plan === "free" && solvesUsedToday >= FREE_DAILY_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    setLoading(true);
    setSolution(null);
    setTimeout(() => {
      const result = solveExpression(question);
      setSolution(result);
      if (!result.error && user.plan === "free") {
        setSolvesUsedToday((n) => n + 1);
      }
      setLoading(false);
    }, 500);
  }

  function handleUpgrade() {
    setUser((u) => ({ ...u, plan: "pro" }));
    setShowUpgrade(false);
  }

  return (
    <div style={styles.page}>
      <ChalkTexture />
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>
            <Calculator size={20} color="#1B2A4A" strokeWidth={2.5} />
          </div>
          <span style={styles.logoText}>Maths Solution Finder</span>
        </div>
        <div style={styles.headerRight}>
          {user ? (
            <>
              <span style={styles.planBadge}>
                {user.plan === "pro" ? (
                  <>
                    <Crown size={13} style={{ marginRight: 4 }} /> Pro
                  </>
                ) : (
                  `${remaining}/${FREE_DAILY_LIMIT} free left today`
                )}
              </span>
              <button style={styles.ghostBtn} onClick={handleLogout}>
                <LogOut size={14} style={{ marginRight: 6 }} />
                {user.email.split("@")[0]}
              </button>
            </>
          ) : (
            <>
              <button style={styles.ghostBtn} onClick={() => setAuthMode("login")}>
                Log in
              </button>
              <button style={styles.primaryBtn} onClick={() => setAuthMode("signup")}>
                Sign up free
              </button>
            </>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>SHOW YOUR WORK</div>
          <h1 style={styles.h1}>
            Every answer,
            <br />
            <span style={styles.h1Accent}>every step.</span>
          </h1>
          <p style={styles.heroSub}>
            Type any arithmetic expression or linear equation. Get the worked
            solution — not just the number.
          </p>
        </section>

        <section style={styles.board}>
          <div style={styles.boardHeader}>
            <span style={styles.boardLabel}>Solve</span>
            {user && user.plan === "free" && (
              <span style={styles.chip}>{remaining} of {FREE_DAILY_LIMIT} today</span>
            )}
            {user && user.plan === "pro" && (
              <span style={{ ...styles.chip, background: "#3E8E7E", color: "#F7F5F0" }}>
                <Crown size={12} style={{ marginRight: 4 }} /> Unlimited
              </span>
            )}
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="e.g. 2x + 3 = 7   or   (4+5)*3-2"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSolve()}
            />
            <button style={styles.solveBtn} onClick={handleSolve} disabled={loading}>
              {loading ? "Solving…" : "Solve"}
              <ChevronRight size={16} style={{ marginLeft: 4 }} />
            </button>
          </div>

          {solution && (
            <div style={styles.solutionBox}>
              {solution.error ? (
                <div style={styles.errorText}>
                  <X size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                  {solution.error}
                </div>
              ) : (
                <>
                  {solution.steps.map((s, i) => (
                    <div key={i} style={styles.stepRow}>
                      <span style={styles.stepNum}>{i + 1}</span>
                      <span style={styles.stepText}>{s}</span>
                    </div>
                  ))}
                  <div style={styles.finalAnswer}>
                    <Check size={16} style={{ marginRight: 8 }} />
                    {solution.result}
                  </div>
                </>
              )}
            </div>
          )}

          {!user && (
            <p style={styles.hint}>
              <Lock size={12} style={{ marginRight: 6 }} />
              Sign up free to start solving — {FREE_DAILY_LIMIT} solves a day, no card required.
            </p>
          )}
        </section>

        <section style={styles.pricing}>
          <div style={styles.priceCard}>
            <div style={styles.priceTier}>Free</div>
            <div style={styles.priceAmount}>$0</div>
            <ul style={styles.priceList}>
              <li>{FREE_DAILY_LIMIT} solves per day</li>
              <li>Step-by-step working</li>
              <li>Arithmetic + linear equations</li>
            </ul>
          </div>
          <div style={{ ...styles.priceCard, ...styles.priceCardPro }}>
            <div style={styles.priceTier}>
              <Crown size={14} style={{ marginRight: 6 }} /> Pro
            </div>
            <div style={styles.priceAmount}>
              $4<span style={styles.priceUnit}>/month</span>
            </div>
            <ul style={styles.priceList}>
              <li>Unlimited solves</li>
              <li>Priority solving</li>
              <li>Full step-by-step working</li>
            </ul>
            <button
              style={styles.primaryBtn}
              onClick={() => (user ? setShowUpgrade(true) : setAuthMode("signup"))}
            >
              Go Pro
            </button>
          </div>
        </section>
      </main>

      {authMode && (
        <Modal onClose={() => setAuthMode(null)}>
          <h2 style={styles.modalTitle}>
            {authMode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <form onSubmit={handleAuthSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.modalInput}
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <label style={styles.label}>Password</label>
            <input
              style={styles.modalInput}
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="At least 4 characters"
            />
            {authError && <div style={styles.errorText}>{authError}</div>}
            <button type="submit" style={{ ...styles.primaryBtn, width: "100%", justifyContent: "center", marginTop: 8 }}>
              {authMode === "signup" ? "Sign up free" : "Log in"}
            </button>
          </form>
          <p style={styles.modalSwitch}>
            {authMode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              style={styles.linkBtn}
              onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
            >
              {authMode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </Modal>
      )}

      {showUpgrade && (
        <Modal onClose={() => setShowUpgrade(false)}>
          <Sparkles size={22} color="#D4A44C" />
          <h2 style={styles.modalTitle}>You've used today's free solves</h2>
          <p style={styles.modalBody}>
            Upgrade to Pro for unlimited solves — $4/month, cancel anytime.
          </p>
          <button style={{ ...styles.primaryBtn, width: "100%", justifyContent: "center" }} onClick={handleUpgrade}>
            <Crown size={15} style={{ marginRight: 6 }} /> Upgrade for $4/month
          </button>
          <button style={styles.linkBtn} onClick={() => setShowUpgrade(false)}>
            Not now
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ChalkTexture() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.035, zIndex: 0 }}>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

const NAVY = "#1B2A4A";
const CHALK = "#F7F5F0";
const AMBER = "#D4A44C";
const TEAL = "#3E8E7E";

const styles = {
  page: { minHeight: "100vh", background: NAVY, color: CHALK, fontFamily: "'Inter', -apple-system, sans-serif", position: "relative", overflow: "hidden" },
  header: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid rgba(247,245,240,0.12)" },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 8, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  planBadge: { fontSize: 12, color: "rgba(247,245,240,0.6)", display: "flex", alignItems: "center" },
  ghostBtn: { background: "transparent", border: "1px solid rgba(247,245,240,0.25)", color: CHALK, padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", fontWeight: 500 },
  primaryBtn: { background: AMBER, border: "none", color: NAVY, padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" },
  main: { position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" },
  hero: { textAlign: "center", marginBottom: 44 },
  eyebrow: { fontSize: 12, letterSpacing: "0.14em", color: AMBER, fontWeight: 700, marginBottom: 14 },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 44, lineHeight: 1.08, margin: 0, fontWeight: 600 },
  h1Accent: { color: AMBER, fontStyle: "italic" },
  heroSub: { color: "rgba(247,245,240,0.65)", fontSize: 15, marginTop: 18, lineHeight: 1.6 },
  board: { background: "rgba(247,245,240,0.04)", border: "1px solid rgba(247,245,240,0.14)", borderRadius: 16, padding: 24, marginBottom: 40 },
  boardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  boardLabel: { fontSize: 12, letterSpacing: "0.1em", color: "rgba(247,245,240,0.5)", fontWeight: 700 },
  chip: { fontSize: 11, background: "rgba(247,245,240,0.1)", padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center" },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(247,245,240,0.2)", borderRadius: 10, padding: "14px 16px", color: CHALK, fontSize: 16, fontFamily: "'JetBrains Mono', monospace", outline: "none" },
  solveBtn: { background: AMBER, border: "none", color: NAVY, padding: "0 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center" },
  solutionBox: { marginTop: 20, paddingTop: 20, borderTop: "1px dashed rgba(247,245,240,0.2)" },
  stepRow: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 },
  stepNum: { width: 20, height: 20, borderRadius: "50%", background: "rgba(212,164,76,0.2)", color: AMBER, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepText: { color: "rgba(247,245,240,0.85)" },
  finalAnswer: { marginTop: 14, display: "flex", alignItems: "center", background: "rgba(62,142,126,0.15)", color: TEAL, padding: "12px 16px", borderRadius: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 16 },
  errorText: { display: "flex", alignItems: "center", color: "#E28B7D", fontSize: 13.5 },
  hint: { display: "flex", alignItems: "center", fontSize: 12.5, color: "rgba(247,245,240,0.5)", marginTop: 16 },
  pricing: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  priceCard: { background: "rgba(247,245,240,0.04)", border: "1px solid rgba(247,245,240,0.14)", borderRadius: 16, padding: 24 },
  priceCardPro: { borderColor: AMBER, background: "rgba(212,164,76,0.06)" },
  priceTier: { fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", color: "rgba(247,245,240,0.7)", marginBottom: 8 },
  priceAmount: { fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, marginBottom: 16 },
  priceUnit: { fontSize: 14, color: "rgba(247,245,240,0.5)", fontWeight: 400 },
  priceList: { listStyle: "none", padding: 0, margin: "0 0 18px", fontSize: 13.5, color: "rgba(247,245,240,0.75)", lineHeight: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: NAVY, border: "1px solid rgba(247,245,240,0.15)", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%", position: "relative" },
  modalClose: { position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: CHALK, cursor: "pointer" },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 22, margin: "10px 0 6px", fontWeight: 600 },
  modalBody: { color: "rgba(247,245,240,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 18 },
  form: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "rgba(247,245,240,0.6)", marginTop: 8 },
  modalInput: { background: "rgba(0,0,0,0.25)", border: "1px solid rgba(247,245,240,0.2)", borderRadius: 8, padding: "10px 12px", color: CHALK, fontSize: 14, outline: "none" },
  modalSwitch: { fontSize: 13, color: "rgba(247,245,240,0.6)", marginTop: 16, textAlign: "center" },
  linkBtn: { background: "transparent", border: "none", color: AMBER, cursor: "pointer", fontWeight: 600, fontSize: 13, textDecoration: "underline" },
};
