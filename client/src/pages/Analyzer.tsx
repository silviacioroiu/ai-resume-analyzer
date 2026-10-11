import { AIChatBox, type Message } from "@/components/AIChatBox";
import { ScoreRing, scoreTone } from "@/components/ScoreRing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { authHeaders } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

interface UploadedResume {
  resumeText: string;
  resumeFileName: string;
  resumeFileKey: string;
  resumeFileUrl: string;
}

interface UploadResponse {
  success: boolean;
  data?: UploadedResume;
  error?: string;
}

const SUGGESTED_PROMPTS = [
  "What should I fix first?",
  "Rewrite my weakest bullet point",
  "Which keywords from the job am I missing?",
];

export default function Analyzer() {
  useAuth({ redirectOnUnauthenticated: true });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [uploaded, setUploaded] = useState<UploadedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const analyzeMutation = trpc.resume.analyze.useMutation({
    onError: err => setError(err.message),
  });
  const analysis = analyzeMutation.data;

  const chatMutation = trpc.resume.chat.useMutation({
    onSuccess: ({ reply }) =>
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]),
    onError: err =>
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.message}` },
      ]),
  });

  const reset = () => {
    analyzeMutation.reset();
    chatMutation.reset();
    setUploaded(null);
    setSelectedFile(null);
    setJobDescription("");
    setChatMessages([]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploaded(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const response = await fetch("/api/upload-resume", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const result: UploadResponse = await response.json();
      if (result.success && result.data) {
        setUploaded(result.data);
      } else {
        setError(result.error || "Failed to upload file");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!uploaded) return;
    setError(null);
    analyzeMutation.mutate({
      ...uploaded,
      jobDescription: jobDescription.trim() || undefined,
    });
  };

  const handleSendChat = (content: string) => {
    if (!analysis) return;
    const next: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(next);
    // Only send real turns (not error notices) back to the server.
    const history = next.filter(
      m => !(m.role === "assistant" && m.content.startsWith("⚠️"))
    );
    chatMutation.mutate({ analysisId: analysis.id, messages: history });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Resume Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Upload your CV, paste a job description, and get a match score with
            concrete feedback.
          </p>
        </div>

        {!analysis ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  1. Upload your resume
                </CardTitle>
                <CardDescription>PDF or DOCX, max 10 MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resume-file">Resume file</Label>
                  <Input
                    id="resume-file"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>

                {uploaded ? (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      ✓ Text extracted from {uploaded.resumeFileName} (
                      {uploaded.resumeText.length.toLocaleString()} characters)
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" /> Upload & extract
                        text
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {uploaded && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Job description (optional)</CardTitle>
                  <CardDescription>
                    With a job description you get a match score for that role;
                    without one, an overall quality score.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                        Analyzing with Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" /> Analyze resume
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-6">
                <ScoreRing score={analysis.matchScore} />
                <div className="text-center sm:text-left">
                  <p
                    className={`text-sm font-semibold uppercase tracking-wide ${scoreTone(analysis.matchScore).color}`}
                  >
                    {jobDescription.trim()
                      ? scoreTone(analysis.matchScore).label
                      : "Overall resume quality"}
                  </p>
                  <p className="mt-2 text-gray-700">{analysis.summary}</p>
                </div>
              </CardContent>
            </Card>

            <ResultSection
              title="✓ Strengths"
              className="text-green-600"
              body={analysis.strengths}
            />
            <ResultSection
              title="⚠ Weaknesses"
              className="text-orange-600"
              body={analysis.weaknesses}
            />
            <ResultSection
              title="💡 Suggestions"
              className="text-blue-600"
              body={analysis.suggestions}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Ask follow-up questions
                </CardTitle>
                <CardDescription>
                  The assistant knows your resume, the job description and this
                  analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIChatBox
                  messages={chatMessages}
                  onSendMessage={handleSendChat}
                  isLoading={chatMutation.isPending}
                  height="460px"
                  placeholder="e.g. How can I make my project section stronger?"
                  emptyStateMessage="Ask anything about your analysis"
                  suggestedPrompts={SUGGESTED_PROMPTS}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                Analyze another resume
              </Button>
              <Link href="/history" className="flex-1">
                <Button variant="ghost" className="w-full">
                  View history
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  className,
  body,
}: {
  title: string;
  className: string;
  body: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={className}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <Streamdown>{body}</Streamdown>
        </div>
      </CardContent>
    </Card>
  );
}
