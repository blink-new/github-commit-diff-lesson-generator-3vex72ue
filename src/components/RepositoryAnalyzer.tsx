import { useState } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { useToast } from '../hooks/use-toast'
import { GitBranch, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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

interface RepositoryAnalyzerProps {
  onRepositoryAnalyzed: (repository: Repository) => void
}

export function RepositoryAnalyzer({ onRepositoryAnalyzed }: RepositoryAnalyzerProps) {
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const parseGitHubUrl = (url: string) => {
    const githubRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/
    const match = url.match(githubRegex)
    
    if (!match) {
      throw new Error('Invalid GitHub URL format')
    }
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    }
  }

  const simulateCommitData = (repoName: string, owner: string) => {
    const commits = []
    const commitMessages = [
      'Initial commit',
      'Add basic project structure',
      'Implement core functionality',
      'Add user authentication',
      'Fix authentication bugs',
      'Add database integration',
      'Implement API endpoints',
      'Add error handling',
      'Update documentation',
      'Optimize performance',
      'Add unit tests',
      'Fix security vulnerabilities',
      'Update dependencies',
      'Add new features',
      'Final cleanup and release'
    ]

    const authors = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']
    
    for (let i = 0; i < Math.min(commitMessages.length, 10); i++) {
      const author = authors[Math.floor(Math.random() * authors.length)]
      const date = new Date(Date.now() - (commitMessages.length - i) * 24 * 60 * 60 * 1000)
      
      commits.push({
        id: `commit_${Date.now()}_${i}`,
        sha: Math.random().toString(36).substring(2, 10),
        message: commitMessages[i],
        authorName: author,
        authorEmail: `${author.toLowerCase().replace(' ', '.')}@example.com`,
        date: date.toISOString(),
        filesChanged: Math.floor(Math.random() * 10) + 1,
        additions: Math.floor(Math.random() * 100) + 10,
        deletions: Math.floor(Math.random() * 50) + 1,
        commitOrder: i + 1
      })
    }

    return commits
  }

  const simulateCommitFiles = (commitId: string, filesChanged: number) => {
    const fileExtensions = ['.js', '.ts', '.tsx', '.css', '.html', '.md', '.json']
    const fileNames = ['index', 'app', 'component', 'utils', 'config', 'styles', 'readme']
    const statuses = ['added', 'modified', 'deleted']
    
    const files = []
    
    for (let i = 0; i < filesChanged; i++) {
      const fileName = fileNames[Math.floor(Math.random() * fileNames.length)]
      const extension = fileExtensions[Math.floor(Math.random() * fileExtensions.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      const patch = status === 'added' 
        ? `+++ b/${fileName}${extension}\n@@ -0,0 +1,${Math.floor(Math.random() * 20) + 5} @@\n${Array(Math.floor(Math.random() * 10) + 3).fill(0).map(() => `+  // New line of code`).join('\n')}`
        : status === 'deleted'
        ? `--- a/${fileName}${extension}\n@@ -1,${Math.floor(Math.random() * 20) + 5} +0,0 @@\n${Array(Math.floor(Math.random() * 10) + 3).fill(0).map(() => `-  // Removed line of code`).join('\n')}`
        : `--- a/${fileName}${extension}\n+++ b/${fileName}${extension}\n@@ -${Math.floor(Math.random() * 10) + 1},${Math.floor(Math.random() * 5) + 3} +${Math.floor(Math.random() * 10) + 1},${Math.floor(Math.random() * 5) + 3} @@\n-  // Old line of code\n+  // New line of code`
      
      files.push({
        id: `file_${Date.now()}_${i}`,
        commitId,
        filename: `${fileName}${extension}`,
        status,
        additions: status === 'deleted' ? 0 : Math.floor(Math.random() * 20) + 1,
        deletions: status === 'added' ? 0 : Math.floor(Math.random() * 10) + 1,
        patch
      })
    }
    
    return files
  }

  const analyzeRepository = async () => {
    if (!url.trim()) {
      setError('Please enter a GitHub repository URL')
      return
    }

    try {
      setAnalyzing(true)
      setError('')
      setProgress(0)
      setCurrentStep('Parsing repository URL...')

      const { owner, repo } = parseGitHubUrl(url.trim())
      
      setProgress(20)
      setCurrentStep('Creating repository record...')

      // Create repository record
      const repositoryId = `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const repository = await blink.db.repositories.create({
        id: repositoryId,
        user_id: (await blink.auth.me()).id,
        name: repo,
        full_name: `${owner}/${repo}`,
        url: url.trim(),
        description: `Repository ${repo} by ${owner}`,
        default_branch: 'main',
        total_commits: 0,
        analysis_status: 'analyzing'
      })

      setProgress(40)
      setCurrentStep('Fetching commit history...')

      // Simulate commit data (in real implementation, this would call GitHub API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const commits = simulateCommitData(repo, owner)

      setProgress(60)
      setCurrentStep('Processing commits and generating diffs...')

      // Create commit records and files
      for (let i = 0; i < commits.length; i++) {
        const commit = commits[i]
        
        // Create commit record
        await blink.db.commits.create({
          id: commit.id,
          repository_id: repositoryId,
          sha: commit.sha,
          message: commit.message,
          author_name: commit.authorName,
          author_email: commit.authorEmail,
          date: commit.date,
          files_changed: commit.filesChanged,
          additions: commit.additions,
          deletions: commit.deletions,
          commit_order: commit.commitOrder
        })

        // Create commit files
        const files = simulateCommitFiles(commit.id, commit.filesChanged)
        for (const file of files) {
          await blink.db.commit_files.create({
            id: file.id,
            commit_id: file.commitId,
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch
          })
        }

        setProgress(60 + (i / commits.length) * 30)
      }

      setProgress(90)
      setCurrentStep('Finalizing analysis...')

      // Update repository status
      await blink.db.repositories.update(repositoryId, {
        total_commits: commits.length,
        analysis_status: 'completed'
      })

      setProgress(100)
      setCurrentStep('Analysis complete!')

      await new Promise(resolve => setTimeout(resolve, 500))

      const finalRepository: Repository = {
        id: repositoryId,
        name: repo,
        fullName: `${owner}/${repo}`,
        url: url.trim(),
        description: `Repository ${repo} by ${owner}`,
        defaultBranch: 'main',
        totalCommits: commits.length,
        analysisStatus: 'completed'
      }

      onRepositoryAnalyzed(finalRepository)

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${commits.length} commits from ${repo}`,
      })

    } catch (error) {
      console.error('Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze repository')
      toast({
        title: "Analysis Failed",
        description: "Please check the URL and try again",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <GitBranch className="w-6 h-6 mr-2 text-blue-600" />
          Analyze GitHub Repository
        </CardTitle>
        <p className="text-sm text-slate-600">
          Enter a GitHub repository URL to generate commit-by-commit lessons with AI-powered explanations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repo-url">Repository URL</Label>
          <Input
            id="repo-url"
            type="url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={analyzing}
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            Example: https://github.com/facebook/react
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analyzing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                {currentStep}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-slate-500">
              This may take a few moments depending on repository size...
            </p>
          </div>
        )}

        <Button
          onClick={analyzeRepository}
          disabled={analyzing || !url.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Repository...
            </>
          ) : (
            <>
              <GitBranch className="w-4 h-4 mr-2" />
              Start Analysis
            </>
          )}
        </Button>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            What happens next?
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Extract all commits and their changes</li>
            <li>• Generate diff files for each commit</li>
            <li>• Create AI-powered lessons explaining the code</li>
            <li>• Provide line-by-line development insights</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}