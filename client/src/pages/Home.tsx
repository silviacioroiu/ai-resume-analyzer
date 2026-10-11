import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Sparkles,
  FileText,
  TrendingUp,
  History,
  LogIn,
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/history">
                  <Button variant="ghost">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </Link>
                <span className="text-sm text-gray-600">{user?.name}</span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {!isAuthenticated ? (
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900">
                Improve Your Resume with AI
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Upload your CV and get instant, actionable feedback powered by
                advanced AI. Perfect for students looking for their first job or
                internship.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <FileText className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle>Upload Your CV</CardTitle>
                  <CardDescription>
                    Support for PDF and DOCX formats. Quick and secure file
                    processing.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Sparkles className="w-12 h-12 text-purple-600 mb-4" />
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>
                    Advanced AI identifies strengths, weaknesses, and provides
                    tailored suggestions.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                  <CardTitle>Improve & Succeed</CardTitle>
                  <CardDescription>
                    Get actionable feedback to make your resume stand out to
                    employers.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How It Works
              </h3>
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Upload Your Resume
                    </h4>
                    <p className="text-gray-600">
                      Upload your CV in PDF or Word format. Our system extracts
                      the text automatically.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Add Job Description (Optional)
                    </h4>
                    <p className="text-gray-600">
                      Paste a job description to get tailored feedback specific
                      to that role.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Get AI Feedback
                    </h4>
                    <p className="text-gray-600">
                      Receive detailed analysis highlighting your strengths,
                      weaknesses, and improvement suggestions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-xl text-gray-600">
                Ready to analyze your resume and get AI-powered feedback?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/analyzer">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>New Analysis</CardTitle>
                    <CardDescription>
                      Upload a new resume and get instant AI-powered feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Start Analyzing</Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/history">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <History className="w-12 h-12 text-purple-600 mb-4" />
                    <CardTitle>Analysis History</CardTitle>
                    <CardDescription>
                      View all your past resume analyses and feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 {APP_TITLE}. Powered by AI to help students succeed.</p>
        </div>
      </footer>
    </div>
  );
}
