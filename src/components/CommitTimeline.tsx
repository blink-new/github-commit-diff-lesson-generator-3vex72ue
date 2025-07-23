import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { GitCommit, User, Calendar, FileText, Plus, Minus } from 'lucide-react'

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

interface CommitTimelineProps {
  commits: Commit[]
  selectedCommit: Commit | null
  onCommitSelect: (commit: Commit) => void
}

export function CommitTimeline({ commits, selectedCommit, onCommitSelect }: CommitTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCommitTypeColor = (message: string) => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (lowerMessage.includes('add') || lowerMessage.includes('implement')) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    if (lowerMessage.includes('update') || lowerMessage.includes('improve')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (lowerMessage.includes('initial') || lowerMessage.includes('first')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <GitCommit className="w-5 h-5 mr-2" />
          Commit Timeline
        </CardTitle>
        <p className="text-sm text-slate-600">
          {commits.length} commits • Click to explore
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {commits.map((commit, index) => (
              <div key={commit.id} className="relative">
                {/* Timeline line */}
                {index < commits.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-8 bg-slate-200" />
                )}
                
                <Button
                  variant="ghost"
                  className={`w-full p-0 h-auto ${
                    selectedCommit?.id === commit.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onCommitSelect(commit)}
                >
                  <div className="w-full p-3 text-left">
                    <div className="flex items-start space-x-3">
                      {/* Commit indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedCommit?.id === commit.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <GitCommit className="w-4 h-4" />
                      </div>

                      {/* Commit details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900 text-sm leading-tight">
                            {commit.message}
                          </h4>
                          <Badge className={`text-xs ml-2 ${getCommitTypeColor(commit.message)}`}>
                            #{commit.commitOrder}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {commit.authorName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(commit.date)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <div className="flex items-center text-slate-600">
                            <FileText className="w-3 h-3 mr-1" />
                            {commit.filesChanged} files
                          </div>
                          <div className="flex items-center text-green-600">
                            <Plus className="w-3 h-3 mr-1" />
                            {commit.additions}
                          </div>
                          <div className="flex items-center text-red-600">
                            <Minus className="w-3 h-3 mr-1" />
                            {commit.deletions}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-400 font-mono">
                          {commit.sha.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {commits.length === 0 && (
          <div className="text-center py-8">
            <GitCommit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No commits found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}