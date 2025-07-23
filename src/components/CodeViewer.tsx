import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Skeleton } from './ui/skeleton'
import { useToast } from '../hooks/use-toast'
import { Code, FileText, GitCompare, Plus, Minus, FileIcon } from 'lucide-react'

interface Commit {
  id: string
  sha: string
  message: string
  authorName: string
  date: string
  filesChanged: number
  additions: number
  deletions: number
}

interface CommitFile {
  id: string
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string
}

interface CodeViewerProps {
  commit: Commit
}

export function CodeViewer({ commit }: CodeViewerProps) {
  const [files, setFiles] = useState<CommitFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<CommitFile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadCommitFiles = async () => {
      try {
        setLoading(true)
        const filesData = await blink.db.commitFiles.list({
          where: { commitId: commit.id }
        })

        const formattedFiles = filesData.map(file => ({
          id: file.id,
          filename: file.filename,
          status: file.status,
          additions: file.additions || 0,
          deletions: file.deletions || 0,
          patch: file.patch || ''
        }))

        setFiles(formattedFiles)
        if (formattedFiles.length > 0) {
          setSelectedFile(formattedFiles[0])
        }
      } catch (error) {
        console.error('Error loading commit files:', error)
        toast({
          title: "Error",
          description: "Failed to load commit files",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadCommitFiles()
  }, [commit.id, toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'modified':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Plus className="w-3 h-3" />
      case 'modified':
        return <FileText className="w-3 h-3" />
      case 'deleted':
        return <Minus className="w-3 h-3" />
      default:
        return <FileIcon className="w-3 h-3" />
    }
  }

  const formatPatch = (patch: string) => {
    if (!patch) return []
    
    const lines = patch.split('\n')
    return lines.map((line, index) => {
      let className = 'text-slate-700'
      let prefix = ''
      
      if (line.startsWith('+++') || line.startsWith('---')) {
        className = 'text-slate-500 font-medium'
      } else if (line.startsWith('@@')) {
        className = 'text-blue-600 font-medium bg-blue-50'
      } else if (line.startsWith('+')) {
        className = 'text-green-700 bg-green-50'
        prefix = '+'
      } else if (line.startsWith('-')) {
        className = 'text-red-700 bg-red-50'
        prefix = '-'
      } else if (line.startsWith(' ')) {
        prefix = ' '
      }
      
      return {
        id: index,
        content: line.substring(prefix ? 1 : 0),
        className,
        prefix,
        originalLine: line
      }
    })
  }

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ext || 'txt'
  }

  const getLanguageFromExtension = (ext: string) => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust'
    }
    return languageMap[ext] || 'text'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Code className="w-5 h-5 mr-2" />
          Code Changes
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            {files.length} files changed
          </div>
          <div className="flex items-center text-green-600">
            <Plus className="w-4 h-4 mr-1" />
            {commit.additions} additions
          </div>
          <div className="flex items-center text-red-600">
            <Minus className="w-4 h-4 mr-1" />
            {commit.deletions} deletions
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No files changed in this commit</p>
          </div>
        ) : (
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Files ({files.length})
              </TabsTrigger>
              <TabsTrigger value="diff" className="flex items-center">
                <GitCompare className="w-4 h-4 mr-2" />
                Diff View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-4">
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedFile?.id === file.id
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getStatusColor(file.status)}`}>
                          {getStatusIcon(file.status)}
                          <span className="ml-1">{file.status}</span>
                        </Badge>
                        <span className="font-mono text-sm text-slate-700">
                          {file.filename}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        {file.additions > 0 && (
                          <span className="text-green-600">+{file.additions}</span>
                        )}
                        {file.deletions > 0 && (
                          <span className="text-red-600">-{file.deletions}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      {getLanguageFromExtension(getFileExtension(file.filename))} • 
                      {file.additions + file.deletions} changes
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="diff" className="mt-4">
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(selectedFile.status)}`}>
                        {getStatusIcon(selectedFile.status)}
                        <span className="ml-1">{selectedFile.status}</span>
                      </Badge>
                      <span className="font-mono text-sm font-medium">
                        {selectedFile.filename}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span className="text-green-600">+{selectedFile.additions}</span>
                      <span className="text-red-600">-{selectedFile.deletions}</span>
                    </div>
                  </div>

                  <ScrollArea className="h-96 border rounded-lg">
                    <div className="font-mono text-sm">
                      {formatPatch(selectedFile.patch).map((line) => (
                        <div
                          key={line.id}
                          className={`px-4 py-1 ${line.className} border-l-2 ${
                            line.prefix === '+' ? 'border-l-green-400' :
                            line.prefix === '-' ? 'border-l-red-400' :
                            'border-l-transparent'
                          }`}
                        >
                          <span className="select-none text-slate-400 mr-2 w-8 inline-block text-right">
                            {line.id + 1}
                          </span>
                          <span className="select-none text-slate-400 mr-2">
                            {line.prefix}
                          </span>
                          <span>{line.content}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Select a file to view the diff</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}