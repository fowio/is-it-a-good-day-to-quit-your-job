import { useState, useEffect, useRef, useCallback } from "react";

const SCRAMBLE_CHARS = "!@#$%^&*<>?/|~+=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§±€£¥∆";

const REASONS = [
  "Mercury is in retrograde and your inbox is not equipped to handle that.",
  "Your desk plant has been dead for three months and nobody said a word.",
  "The vibes in that conference room are legally considered a biohazard.",
  "You have been \"looped in\" on an email thread 47 times without being asked anything.",
  "A stranger on LinkedIn with a headshot taken in a parking garage makes more than you.",
  "You typed \"per my last email\" in your head but sent a smiley face instead. That is not sustainable.",
  "The universe opened a door. It smells like a startup and unlimited PTO.",
  "Your manager's manager has never once made eye contact with you.",
  "There is a mandatory fun event this Friday. You were not consulted.",
  "Jupiter is conjunct your midheaven, which is astrology for \"leave immediately.\"",
  "The printer has jammed every single Thursday for eleven months. That is not a coincidence.",
  "Your LinkedIn profile views spiked. Someone out there believes in you more than your skip-level does.",
  "You have eaten lunch at your desk so many times your keyboard has a flavor.",
  "That idea you pitched in Q3 2022 just got announced as a company initiative. With someone else's name on it.",
  "The energy you spend writing status update emails could power a small side business.",
  "A performance review called you \"meets expectations\" and you have not stopped thinking about it since.",
  "Your highest-performing self does not have a lanyard.",
  "The office has a ping-pong table that no one is allowed to use during core hours, which are 9 to 6.",
  "You muted the all-hands Slack channel and felt immediate peace. That is information.",
  "Saturn is returning and it has read your job description very carefully.",
  "Three people have quit in the past month and their roles were absorbed into yours without discussion.",
  "The free coffee is actually a retention strategy and you deserve to know that.",
  "You whispered \"I can't do this anymore\" under your breath during a sync. The sync was optional.",
  "Your out-of-office message brings you more joy to write than any deliverable you have shipped.",
  "The company's core value of \"move fast\" does not apply to your promotion timeline.",
  "A recruiter DM'd you the same week your company announced a \"values realignment.\" Read the signs.",
  "You have said \"circling back\" unironically and it has changed you on a cellular level.",
  "The new org chart has you three boxes lower than where you thought you were.",
  "Your gut has been trying to calendar-block time with you for months. Accept the invite.",
  "There is a stack of post-it notes on your monitor from 2023 and none of them sparked joy.",
];

function rc() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function rs(n: number) {
  return Array.from({ length: n }, rc).join("");
}

function pickRandom(list: string[], exclude: string): string {
  const filtered = list.filter((r) => r !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

type Phase = "idle" | "animating" | "done";

export default function App() {
  const [display, setDisplay] = useState(() => rs(4));
  const [phase, setPhase] = useState<Phase>("idle");
  const [textColor, setTextColor] = useState("#c0c0c0");
  const [reason, setReason] = useState(
    () => REASONS[Math.floor(Math.random() * REASONS.length)]
  );
  const [reasonVisible, setReasonVisible] = useState(false);

  const genRef = useRef(0);
  const idleActiveRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Idle scramble loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "idle") return;
    idleActiveRef.current = true;
    let lastTime = 0;

    function loop(now: number) {
      if (!idleActiveRef.current) return;
      if (now - lastTime >= 75) {
        setDisplay(rs(4));
        lastTime = now;
      }
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
    return () => {
      idleActiveRef.current = false;
    };
  }, [phase]);

  // ── Animate scramble → target ───────────────────────────────────────────
  const animateTo = useCallback(
    (
      target: string,
      color: string,
      duration: number,
      onDone: () => void
    ) => {
      const myGen = ++genRef.current;
      const chars = target.split("");
      const startTime = performance.now();
      setTextColor(color);

      function frame(now: number) {
        if (genRef.current !== myGen) return;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Each char locks in left→right with a 15% initial scramble delay
        const result = chars.map((char, i) => {
          const lockAt = 0.15 + (0.8 * (i + 1)) / chars.length;
          return progress >= lockAt ? char : rc();
        });

        setDisplay(result.join(""));

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          setDisplay(target);
          if (genRef.current === myGen) onDone();
        }
      }

      requestAnimationFrame(frame);
    },
    []
  );

  // ── Scramble wildly for a fixed duration ───────────────────────────────
  const scrambleFor = useCallback((duration: number, onDone: () => void) => {
    const myGen = ++genRef.current;
    const endTime = performance.now() + duration;
    let lastTime = 0;

    function frame(now: number) {
      if (genRef.current !== myGen) return;
      if (now - lastTime >= 45) {
        setDisplay(rs(4));
        lastTime = now;
      }
      if (now < endTime) {
        requestAnimationFrame(frame);
      } else {
        if (genRef.current === myGen) onDone();
      }
    }

    requestAnimationFrame(frame);
  }, []);

  // ── Reveal click ────────────────────────────────────────────────────────
  const handleReveal = useCallback(() => {
    if (phase !== "idle") return;
    idleActiveRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("animating");

    const isSpecial = Math.random() < 1 / 3;

    if (isSpecial) {
      // ── Special: reveal NO. → panic scramble → reveal YES. ──
      animateTo("NO.", "#444", 1700, () => {
        timeoutRef.current = setTimeout(() => {
          setTextColor("#aaa");
          scrambleFor(500, () => {
            animateTo("YES.", "#e8441c", 2300, () => {
              setPhase("done");
              setReasonVisible(true);
            });
          });
        }, 850);
      });
    } else {
      // ── Normal: straight reveal of YES. ──
      animateTo("YES.", "#e8441c", 2600, () => {
        setPhase("done");
        setReasonVisible(true);
      });
    }
  }, [phase, animateTo, scrambleFor]);

  // ── Convince me again ───────────────────────────────────────────────────
  const handleConvinceAgain = useCallback(() => {
    const next = pickRandom(REASONS, reason);
    setReasonVisible(false);
    timeoutRef.current = setTimeout(() => {
      setReason(next);
      setReasonVisible(true);
    }, 200);
  }, [reason]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#ffffff",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #e5e5e5",
          padding: "0 2rem",
          height: "52px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "-0.01em",
            color: "#111",
          }}
        >
          isitagooddaytoquityourjob?
        </span>
      </header>

      {/* Body */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 52px)",
          padding: "3rem 1.5rem",
          textAlign: "center",
        }}
      >
        {/* Question */}
        <h1
          style={{
            fontWeight: 700,
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            color: "#111",
            margin: 0,
            marginBottom: "1.5rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Is it a good day to quit your job?
        </h1>

        {/* Big animated text */}
        <p
          style={{
            fontWeight: 900,
            fontSize: "clamp(5rem, 18vw, 10rem)",
            color: textColor,
            margin: 0,
            marginBottom: phase === "done" ? "1.25rem" : "2.25rem",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontFamily:
              phase === "done"
                ? "'Inter', sans-serif"
                : "'Courier New', monospace",
            transition: "color 0.45s ease, font-family 0.1s",
            userSelect: "none",
          }}
        >
          {display}
        </p>

        {/* Reveal button — only when idle */}
        {phase === "idle" && (
          <button
            onClick={handleReveal}
            style={{
              backgroundColor: "#e8441c",
              border: "none",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "0.8rem 3rem",
              borderRadius: "6px",
              cursor: "pointer",
              letterSpacing: "0.03em",
              boxShadow: "0 2px 12px rgba(232,68,28,0.25)",
              transition: "opacity 0.15s ease, transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.88";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Reveal
          </button>
        )}

        {/* Reason + button — only when done */}
        {phase === "done" && (
          <>
            <p
              style={{
                fontStyle: "italic",
                color: "#888",
                fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
                maxWidth: "480px",
                margin: 0,
                marginBottom: "2.5rem",
                lineHeight: 1.55,
                transition: "opacity 0.2s ease",
                opacity: reasonVisible ? 1 : 0,
              }}
            >
              {reason}
            </p>

            <button
              onClick={handleConvinceAgain}
              style={{
                backgroundColor: "transparent",
                border: "1.5px solid #e8441c",
                color: "#e8441c",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e8441c";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#e8441c";
              }}
            >
              Convince me again
            </button>
          </>
        )}
      </main>

      {/* Fowiohuu card — bottom right */}
      <div
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          backgroundColor: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: "#bbb",
            letterSpacing: "0.04em",
          }}
        >
          fowiohuu
        </span>
      </div>
    </div>
  );
}