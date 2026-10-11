import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";
import { ScoreRing } from "@/components/ScoreRing";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";

export default function History() {
  useAuth({ redirectOnUnauthenticated: true });
  const { data: analyses, isLoading } = trpc.resume.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Analysis History
            </h1>
            <p className="text-gray-600">View all your past resume analyses</p>
          </div>
          <Link href="/analyzer">
            <Button>New Analysis</Button>
          </Link>
        </div>

        {!analyses || analyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No analyses yet</p>
              <Link href="/analyzer">
                <Button>Analyze Your First Resume</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {analyses.map(analysis => (
              <Card
                key={analysis.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {analysis.resumeFileName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(analysis.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </CardDescription>
                    </div>
                    {analysis.matchScore != null && (
                      <ScoreRing
                        score={analysis.matchScore}
                        size={64}
                        className="mr-4"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.jobDescription && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Job Description:
                      </p>
                      <p className="text-sm text-blue-700 line-clamp-2">
                        {analysis.jobDescription}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">
                        Strengths
                      </h4>
                      <div className="text-sm text-gray-700 line-clamp-3 prose prose-sm max-w-none">
                        <Streamdown>{analysis.strengths}</Streamdown>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-orange-600 mb-2">
                        Weaknesses
                      </h4>
                      <div className="text-sm text-gray-700 line-clamp-3 prose prose-sm max-w-none">
                        <Streamdown>{analysis.weaknesses}</Streamdown>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">
                        Suggestions
                      </h4>
                      <div className="text-sm text-gray-700 line-clamp-3 prose prose-sm max-w-none">
                        <Streamdown>{analysis.suggestions}</Streamdown>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
