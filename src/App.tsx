import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { RepositoryAnalyzer } from './components/RepositoryAnalyzer'
import { CommitTimeline } from './components/CommitTimeline'
import { CodeViewer } from './components/CodeViewer'
import { LessonPanel } from './components/LessonPanel'
import { Toaster } from './components/ui/toaster'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { GitBranch, Users, Calendar, FileText } from 'lucide-react'

interface Repository {
  id: string
  name: string
  fullName: string
  url: string
  description: string
  defaultBranch: string
  totalCommits: number
  analysisStatus: string
}

interface Commit {
  id: string
  sha: string
  message: string
  authorName: string
  authorEmail: string
  date: string
  filesChanged: number
  additions: number
  deletions: number
  commitOrder: number
}

interface User {
  id: string
  email: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [repository, setRepository] = useState<Repository | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadCommits = async (repositoryId: string) => {
    try {
      const commitsData = await blink.db.commits.list({
        where: { repository_id: repositoryId },
        orderBy: { commit_order: 'asc' }
      })

      const formattedCommits = commitsData.map(commit => ({
        id: commit.id,
        sha: commit.sha,
        message: commit.message,
        authorName: commit.author_name,
        authorEmail: commit.author_email,
        date: commit.date,
        filesChanged: commit.files_changed || 0,
        additions: commit.additions || 0,
        deletions: commit.deletions || 0,
        commitOrder: commit.commit_order
      }))

      setCommits(formattedCommits)
      if (formattedCommits.length > 0) {
        setSelectedCommit(formattedCommits[0])
      }
    } catch (error) {
      console.error('Error loading commits:', error)
    }
  }

  const handleRepositoryAnalyzed = (repo: Repository) => {
    setRepository(repo)
    loadCommits(repo.id)
  }

  const handleCommitSelect = (commit: Commit) => {
    setSelectedCommit(commit)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <GitBranch className="w-6 h-6 mr-2 text-blue-600" />
              GitHub Lesson Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              Please sign in to analyze GitHub repositories and generate AI-powered lessons.
            </p>
            <button
              onClick={() => blink.auth.login()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GitBranch className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  GitHub Lesson Generator
                </h1>
                <p className="text-sm text-slate-600">
                  AI-powered commit analysis and learning
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                Welcome, {user.email}
              </div>
              <button
                onClick={() => blink.auth.logout()}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!repository ? (
          <div className="max-w-2xl mx-auto">
            <RepositoryAnalyzer onRepositoryAnalyzed={handleRepositoryAnalyzed} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Repository Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{repository.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {repository.description || 'No description available'}
                    </p>
                  </div>
                  <Badge 
                    className={`${
                      repository.analysisStatus === 'completed' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {repository.analysisStatus}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm text-slate-600 mt-4">
                  <div className="flex items-center">
                    <GitBranch className="w-4 h-4 mr-1" />
                    {repository.defaultBranch}
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {repository.totalCommits} commits
                  </div>
                </div>
              </CardHeader>
            </Card>

            {commits.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Commit Timeline */}
                <div className="lg:col-span-1">
                  <CommitTimeline
                    commits={commits}
                    selectedCommit={selectedCommit}
                    onCommitSelect={handleCommitSelect}
                  />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedCommit && (
                    <>
                      {/* Code Viewer */}
                      <CodeViewer commit={selectedCommit} />
                      
                      <Separator />
                      
                      {/* AI Lesson Panel */}
                      <LessonPanel 
                        commit={selectedCommit} 
                        repositoryId={repository.id}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {commits.length === 0 && repository.analysisStatus === 'completed' && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No Commits Found
                  </h3>
                  <p className="text-slate-600">
                    This repository doesn't have any commits to analyze.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}

export default App