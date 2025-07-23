import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Skeleton } from './ui/skeleton'
import { useToast } from '../hooks/use-toast'
import { BookOpen, Sparkles, Clock, Target, Loader2, RefreshCw } from 'lucide-react'

interface Commit {
  id: string
  sha: string
  message: string
  authorName: string
  date: string
  filesChanged: number
  additions: number
  deletions: number
  commitOrder: number
}

interface Lesson {
  id: string
  title: string
  content: string
  summary: string
  keyConcepts: string
  difficultyLevel: string
  estimatedReadingTime: number
  status: string
}

interface LessonPanelProps {
  commit: Commit
  repositoryId: string
}

export function LessonPanel({ commit, repositoryId }: LessonPanelProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const loadLesson = useCallback(async () => {
    try {
      setLoading(true)
      const lessonsData = await blink.db.lessons.list({
        where: { commitId: commit.id },
        limit: 1
      })

      if (lessonsData.length > 0) {
        const lessonData = lessonsData[0]
        setLesson({
          id: lessonData.id,
          title: lessonData.title,
          content: lessonData.content,
          summary: lessonData.summary || '',
          keyConcepts: lessonData.key_concepts || '',
          difficultyLevel: lessonData.difficulty_level || 'beginner',
          estimatedReadingTime: lessonData.estimated_reading_time || 5,
          status: lessonData.status || 'generated'
        })
      } else {
        setLesson(null)
      }
    } catch (error) {
      console.error('Error loading lesson:', error)
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [commit.id, toast])

  useEffect(() => {
    loadLesson()
  }, [loadLesson])

  const generateLesson = async () => {
    try {
      setGenerating(true)
      
      // Get commit files for context
      const filesData = await blink.db.commitFiles.list({
        where: { commitId: commit.id }
      })

      const filesContext = filesData.map(file => ({
        filename: file.filename,
        status: file.status,
        patch: file.patch
      }))

      // Generate lesson using AI
      const prompt = `
        Analyze this Git commit and create a detailed educational lesson explaining the code changes:

        Commit: ${commit.message}
        Author: ${commit.authorName}
        Files changed: ${commit.filesChanged}
        Additions: ${commit.additions}
        Deletions: ${commit.deletions}

        Files and changes:
        ${filesContext.map(file => `
        File: ${file.filename} (${file.status})
        Changes:
        ${file.patch}
        `).join('\n')}

        Please create a comprehensive lesson that explains:
        1. What was changed and why
        2. The technical concepts involved
        3. Best practices demonstrated
        4. Line-by-line explanation of key changes
        5. How this fits into the overall development process

        Format the response as a detailed educational lesson suitable for developers learning from this codebase.
      `

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 2000
      })

      // Create lesson record
      const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newLesson = await blink.db.lessons.create({
        id: lessonId,
        commitId: commit.id,
        title: `Understanding: ${commit.message}`,
        content: text,
        summary: `Learn about the changes made in commit ${commit.sha.substring(0, 8)}`,
        keyConcepts: 'Git, Version Control, Code Analysis',
        difficultyLevel: 'intermediate',
        estimatedReadingTime: Math.ceil(text.length / 200), // Rough estimate
        status: 'generated'
      })

      setLesson({
        id: newLesson.id,
        title: `Understanding: ${commit.message}`,
        content: text,
        summary: `Learn about the changes made in commit ${commit.sha.substring(0, 8)}`,
        keyConcepts: 'Git, Version Control, Code Analysis',
        difficultyLevel: 'intermediate',
        estimatedReadingTime: Math.ceil(text.length / 200),
        status: 'generated'
      })

      toast({
        title: "Lesson Generated",
        description: "AI has created a detailed lesson for this commit",
      })

    } catch (error) {
      console.error('Error generating lesson:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate lesson. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null
      
      // Check if it's a heading (starts with #)
      if (paragraph.startsWith('#')) {
        const level = paragraph.match(/^#+/)?.[0].length || 1
        const text = paragraph.replace(/^#+\s*/, '')
        const className = level === 1 ? 'text-lg font-bold text-slate-900 mt-4 mb-2' :
                         level === 2 ? 'text-base font-semibold text-slate-800 mt-3 mb-2' :
                         'text-sm font-medium text-slate-700 mt-2 mb-1'
        
        return (
          <h3 key={index} className={className}>
            {text}
          </h3>
        )
      }
      
      // Check if it's a code block (starts with ```)
      if (paragraph.startsWith('```')) {
        return null // Skip code block markers for now
      }
      
      // Check if it's a list item
      if (paragraph.match(/^\d+\.\s/) || paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        return (
          <li key={index} className="text-sm text-slate-700 mb-1 ml-4">
            {paragraph.replace(/^\d+\.\s|^[-*]\s/, '')}
          </li>
        )
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-sm text-slate-700 mb-3 leading-relaxed">
          {paragraph}
        </p>
      )
    }).filter(Boolean)
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
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="w-5 h-5 mr-2" />
          AI Lesson
        </CardTitle>
        {lesson && (
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${getDifficultyColor(lesson.difficultyLevel)}`}>
              {lesson.difficultyLevel}
            </Badge>
            <div className="flex items-center text-xs text-slate-500">
              <Clock className="w-3 h-3 mr-1" />
              {lesson.estimatedReadingTime} min read
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!lesson ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-2">
              No Lesson Generated Yet
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate an AI-powered lesson to understand this commit's changes in detail.
            </p>
            <Button 
              onClick={generateLesson}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Lesson...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Lesson
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lesson Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Summary</h4>
                  <p className="text-sm text-blue-800">{lesson.summary}</p>
                </div>
              </div>
            </div>

            {/* Key Concepts */}
            {lesson.keyConcepts && (
              <div className="flex flex-wrap gap-1">
                {lesson.keyConcepts.split(',').map((concept, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {concept.trim()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Lesson Content */}
            <ScrollArea className="h-96">
              <div className="pr-4">
                <div className="prose prose-sm max-w-none">
                  {formatContent(lesson.content)}
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Generated for commit {commit.sha.substring(0, 8)}
              </div>
              <Button
                onClick={generateLesson}
                disabled={generating}
                variant="outline"
                size="sm"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}