"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/video-player";
import { createClient } from "@/lib/supabase/client";
import type { Module, QuizQuestion } from "@/lib/supabase/types";

const EMPLOYEE_COOKIE = "td_employee";

function getEmployeeFromCookie(): { name: string; email: string } | null {
  try {
    const raw = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith(EMPLOYEE_COOKIE + "="));
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

function setEmployeeCookie(name: string, email: string) {
  const value = JSON.stringify({ name, email });
  document.cookie = `${EMPLOYEE_COOKIE}=${encodeURIComponent(value)}; max-age=${60 * 60 * 24 * 30}; path=/; SameSite=Lax`;
}

// ── QuizCard component ────────────────────────────────────────────────────────

function QuizCard({
  title,
  questions,
  submitted,
  score,
  answers,
  onAnswer,
  onSubmit,
}: {
  title: string;
  questions: QuizQuestion[];
  submitted: boolean;
  score?: { score: number; correct: number; total: number };
  answers: Record<string, number>;
  onAnswer: (questionId: string, answer: number) => void;
  onSubmit: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  async function handleSubmit() {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  }

  return (
    <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {submitted && score && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${score.score >= 70 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {score.score}% ({score.correct}/{score.total})
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-text-primary mb-3">
              {qi + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((option, oi) => {
                const isSelected = answers[q.id] === oi;
                const isCorrect = oi === q.correct_answer;
                let optionClass = "flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ";
                if (!submitted) {
                  optionClass += isSelected
                    ? "border-accent bg-accent/10 text-text-primary"
                    : "border-[var(--color-border)] text-text-secondary hover:border-accent/50 hover:text-text-primary";
                } else {
                  if (isCorrect) optionClass += "border-green-500/50 bg-green-500/10 text-green-400";
                  else if (isSelected && !isCorrect) optionClass += "border-red-500/50 bg-red-500/10 text-red-400";
                  else optionClass += "border-[var(--color-border)] text-text-secondary";
                }
                return (
                  <div
                    key={oi}
                    className={optionClass}
                    onClick={() => !submitted && onAnswer(q.id, oi)}
                  >
                    <span className="shrink-0 mt-0.5">{String.fromCharCode(65 + oi)}.</span>
                    <span>{option.replace(/^[A-D]\.\s*/, "")}</span>
                  </div>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="text-xs text-text-secondary mt-2 pl-1">
                <span className="font-semibold text-accent">Explanation: </span>
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <Button
          variant="primary"
          size="sm"
          className="mt-6"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!allAnswered}
        >
          Submit Quiz
        </Button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PublicModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [module, setModule] = useState<Module | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Employee modal
  const [showModal, setShowModal] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employee, setEmployee] = useState<{ name: string; email: string } | null>(null);

  // Completion gate
  const [videoProgress, setVideoProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [quizScores, setQuizScores] = useState<Record<number, { score: number; correct: number; total: number }>>({});

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());

  const canComplete = (!module?.processed_video_url || videoProgress >= 80) && !completed;

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("share_slug", slug)
        .eq("status", "published")
        .single();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setModule(data);

      // Fetch quiz questions
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("module_id", data.id)
        .order("chapter_index")
        .order("sort_order");
      if (questions) setQuizQuestions(questions as QuizQuestion[]);

      // If we have a token, fetch employee info from the server
      if (token) {
        const res = await fetch(`/api/modules/${data.id}/track-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          const completion = await res.json();
          if (completion.team_members) {
            const member = completion.team_members;
            setEmployee({ name: member.name, email: member.email });
            setEmployeeCookie(member.name, member.email);
            // If already completed, mark as done
            if (completion.completed_at) {
              setCompleted(true);
              setCompletedAt(completion.completed_at);
            }
            // Store completion ID for quiz submission
            if (completion.id) {
              setCompletionId(completion.id);
            }
          }
        } else {
          // Invalid token — fall through to normal flow
          const cached = getEmployeeFromCookie();
          if (cached) {
            setEmployee(cached);
          } else {
            setShowModal(true);
          }
        }
      } else {
        // No token — use cookie or show modal
        const cached = getEmployeeFromCookie();
        if (cached) {
          setEmployee(cached);
        } else {
          setShowModal(true);
        }
      }

      setLoading(false);
    }

    init();
  }, [slug, token]); // eslint-disable-line react-hooks/exhaustive-deps


  function handleEmployeeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim()) return;
    setEmployeeCookie(employeeName, employeeEmail);
    setEmployee({ name: employeeName, email: employeeEmail });
    setShowModal(false);
  }

  async function handleComplete() {
    if (!module || !employee) return;
    setCompleting(true);

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const res = await fetch(`/api/modules/${module.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_name: employee.name,
        employee_email: employee.email || null,
        unique_token: token || null,
        time_spent_seconds: timeSpent,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCompleted(true);
      setCompletedAt(data.completed_at ?? new Date().toISOString());
      // Store completion ID for quiz submission
      if (data.id) {
        setCompletionId(data.id);
      }
    } else {
      setCompleteError("Something went wrong. Please try again.");
    }
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !module) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-text-secondary" />
        <h1 className="text-xl font-semibold text-text-primary">
          Training not found
        </h1>
        <p className="text-sm text-text-secondary max-w-xs">
          This training link may have expired or been unpublished.
        </p>
      </div>
    );
  }

  const chapters = module.chapters as unknown as Array<{
    title: string;
    start_time: number;
    summary: string;
  }> | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-surface/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo />
          {employee && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Viewing as</p>
              <p className="text-sm font-medium text-text-primary">
                {employee.name}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {module.title}
          </h1>

          {module.description && (
            <p className="text-sm text-text-secondary mb-6">{module.description}</p>
          )}

          {/* Video (if video module with processed video) */}
          {module.processed_video_url && (
            <div className="mb-8">
              <VideoPlayer
                src={module.processed_video_url}
                vttContent={module.vtt_content || undefined}
                chapters={chapters || undefined}
                onProgress={setVideoProgress}
              />
            </div>
          )}

          {/* SOP content */}
          {module.sop_content && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Standard Operating Procedure
              </h2>
              <div
                className="bg-surface border border-[var(--color-border)] rounded-xl p-6"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-text-primary mb-4 mt-6 first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-text-primary mb-3 mt-5">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-text-primary mb-2 mt-4">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-3 text-sm text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-2 mb-3 text-sm text-text-secondary">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-text-primary">
                        {children}
                      </strong>
                    ),
                    hr: () => <hr className="border-[var(--color-border)] my-4" />,
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="border-b border-[var(--color-border)]">{children}</thead>
                    ),
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => (
                      <tr className="border-b border-[var(--color-border)]/50">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left font-semibold text-text-primary whitespace-nowrap">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-text-secondary">{children}</td>
                    ),
                  }}
                >
                  {module.sop_content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Quiz sections (if any) */}
          {quizQuestions.length > 0 && (() => {
            const chapterQuestions = quizQuestions.filter(q => q.chapter_index >= 0);
            const finalQuestions = quizQuestions.filter(q => q.chapter_index === -1);

            // Group chapter questions by chapter_index
            const byChapter: Record<number, QuizQuestion[]> = {};
            chapterQuestions.forEach(q => {
              if (!byChapter[q.chapter_index]) byChapter[q.chapter_index] = [];
              byChapter[q.chapter_index].push(q);
            });

            return (
              <div className="mb-8 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  Section Quizzes
                </h2>

                {Object.entries(byChapter).map(([idx, questions]) => {
                  const chapterIdx = parseInt(idx);
                  const chapter = chapters?.[chapterIdx];
                  const submitted = quizSubmitted[chapterIdx];
                  const score = quizScores[chapterIdx];

                  return (
                    <QuizCard
                      key={chapterIdx}
                      title={chapter ? chapter.title : `Section ${chapterIdx + 1}`}
                      questions={questions}
                      submitted={submitted}
                      score={score}
                      answers={quizAnswers}
                      onAnswer={(qId, answer) => setQuizAnswers(prev => ({ ...prev, [qId]: answer }))}
                      onSubmit={async () => {
                        const responses = questions.map(q => ({
                          question_id: q.id,
                          selected_answer: quizAnswers[q.id] ?? -1,
                          is_correct: quizAnswers[q.id] === q.correct_answer,
                        }));
                        if (completionId) {
                          const res = await fetch(`/api/modules/${module.id}/quiz-response`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ module_completion_id: completionId, responses }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setQuizScores(prev => ({ ...prev, [chapterIdx]: { score: data.score, correct: data.correct, total: data.total } }));
                          }
                        }
                        setQuizSubmitted(prev => ({ ...prev, [chapterIdx]: true }));
                      }}
                    />
                  );
                })}

                {finalQuestions.length > 0 && (
                  <QuizCard
                    title="Final Test"
                    questions={finalQuestions}
                    submitted={quizSubmitted[-1]}
                    score={quizScores[-1]}
                    answers={quizAnswers}
                    onAnswer={(qId, answer) => setQuizAnswers(prev => ({ ...prev, [qId]: answer }))}
                    onSubmit={async () => {
                      const responses = finalQuestions.map(q => ({
                        question_id: q.id,
                        selected_answer: quizAnswers[q.id] ?? -1,
                        is_correct: quizAnswers[q.id] === q.correct_answer,
                      }));
                      if (completionId) {
                        const res = await fetch(`/api/modules/${module.id}/quiz-response`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ module_completion_id: completionId, responses }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setQuizScores(prev => ({ ...prev, [-1]: { score: data.score, correct: data.correct, total: data.total } }));
                        }
                      }
                      setQuizSubmitted(prev => ({ ...prev, [-1]: true }));
                    }}
                  />
                )}
              </div>
            );
          })()}

          {/* Mark complete */}
          <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 text-center">
            {completed ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Training Complete!
                </h3>
                <p className="text-sm text-text-secondary">
                  Great work, {employee?.name}. Your completion has been recorded.
                </p>
                {completedAt && (
                  <p className="text-xs text-text-secondary opacity-60">
                    Completed {new Date(completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Mark as Complete
                </h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  {!canComplete && module.processed_video_url
                    ? "Watch at least 80% of the video above to enable this button."
                    : "You've reviewed the material. Click to confirm completion."}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => { setCompleteError(null); handleComplete(); }}
                  loading={completing}
                  disabled={!canComplete}
                  className="mt-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Complete
                </Button>
                {completeError && (
                  <p className="text-xs text-red-400 mt-1">{completeError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Employee name modal */}
      <Dialog
        open={showModal}
        onClose={() => {}}
        title="Before you start"
        description={
          token
            ? "Enter your name so your manager can track your training completion."
            : "Enter your name and email so your manager can track your progress."
        }
      >
        <form onSubmit={handleEmployeeSubmit} className="flex flex-col gap-4">
          <Input
            label="Your Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Jane Smith"
            required
            autoFocus
          />
          <Input
            label={token ? "Email (optional)" : "Email"}
            type="email"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
            placeholder="jane@company.com"
            required={!token}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!employeeName.trim() || (!token && !employeeEmail.trim())}
          >
            Start Training
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
