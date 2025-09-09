'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Building2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  client_name: string
  project_manager_name: string
}

interface Milestone {
  id: string
  name: string
  description: string
  due_date: string
  status: string
  completion_percentage: number
  weight_percentage: number
  evidence_required: boolean
  evidence_count: number
  vendor_notes: string
  rejection_reason?: string
}

interface Evidence {
  id: string
  milestone_id: string
  file_name: string
  file_path: string
  uploaded_at: string
  description: string
}

export default function VendorPortalPage() {
  const params = useParams()
  const token = params.token as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [vendorNotes, setVendorNotes] = useState<Record<string, string>>({})
  const [queuedFiles, setQueuedFiles] = useState<Record<string, File[]>>({})

  useEffect(() => {
    if (token) {
      fetchProjectData()
    }
  }, [token])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      
      // Decode token to get project ID
      const decodedToken = atob(token)
      console.log('Decoded token:', decodedToken)
      const projectId = decodedToken.split('_')[1]
      console.log('Project ID:', projectId)
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('project_overview')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch milestones for this project
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select(`
          id,
          name,
          description,
          due_date,
          status,
          completion_percentage,
          weight_percentage,
          evidence_required,
          vendor_notes,
          rejection_reason,
          milestone_evidence(count)
        `)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })

      if (milestonesError) throw milestonesError
      
      const formattedMilestones = (milestonesData || []).map(milestone => ({
        ...milestone,
        evidence_count: milestone.milestone_evidence?.[0]?.count || 0
      }))
      setMilestones(formattedMilestones)

      // Initialize vendor notes
      const notes: Record<string, string> = {}
      formattedMilestones.forEach(milestone => {
        notes[milestone.id] = milestone.vendor_notes || ''
      })
      setVendorNotes(notes)

    } catch (error) {
      console.error('Error fetching project data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const queueFile = (milestoneId: string, file: File) => {
    setQueuedFiles(prev => {
      const existing = prev[milestoneId] || []
      return { ...prev, [milestoneId]: [...existing, file] }
    })
  }

  const removeQueuedFile = (milestoneId: string, index: number) => {
    setQueuedFiles(prev => {
      const existing = prev[milestoneId] || []
      const next = existing.slice()
      next.splice(index, 1)
      return { ...prev, [milestoneId]: next }
    })
  }

  const handleNotesUpdate = async (milestoneId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ vendor_notes: notes })
        .eq('id', milestoneId)

      if (error) throw error

      setVendorNotes(prev => ({
        ...prev,
        [milestoneId]: notes
      }))
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      setSubmitting(true)
      
      // Upload queued files first
      const files = queuedFiles[milestoneId] || []
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${milestoneId}_${Date.now()}.${fileExt}`
        const filePath = fileName
        const { error: uploadError } = await supabase.storage
          .from('evidence-files')
          .upload(filePath, file)
        if (uploadError) throw uploadError

        const { error: evidenceError } = await supabase
          .from('milestone_evidence')
          .insert({
            milestone_id: milestoneId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            description: '',
            uploaded_by: '5cb0ddab-5f60-45b9-a2d8-5b2770e68b1e'
          })
        if (evidenceError) throw evidenceError
      }

      // Clear queue for this milestone
      setQueuedFiles(prev => ({ ...prev, [milestoneId]: [] }))

      const { error } = await supabase
        .from('milestones')
        .update({ 
          status: 'pending_completion_review',
          completion_percentage: 100,
          rejection_reason: null
        })
        .eq('id', milestoneId)

      if (error) throw error

      // Refresh milestones
      await fetchProjectData()
      
      alert('Milestone submitted for review successfully!')
    } catch (error) {
      console.error('Error submitting milestone:', error)
      alert('Failed to submit milestone. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor portal...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <p className="text-gray-600">The vendor portal link is invalid or expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Portal</h1>
              <p className="text-gray-600 mt-1">{project.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{project.client_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Project Manager</p>
                <p className="font-medium text-gray-900">{project.project_manager_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-gray-900">{project.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Start Date</p>
              <p className="text-gray-900">{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">End Date</p>
              <p className="text-gray-900">{new Date(project.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
          
          {milestones.map((milestone) => (
            <div key={milestone.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{milestone.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'approved' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'pending_completion_review' ? 'bg-yellow-100 text-yellow-800' :
                        milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        milestone.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        milestone.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{milestone.description}</p>
                    
                    {/* Rejection Reason */}
                    {milestone.status === 'rejected' && milestone.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <h6 className="text-sm font-medium text-red-800">Rejection Reason:</h6>
                            <p className="text-sm text-red-700 mt-1">{milestone.rejection_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center space-x-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        Evidence: {milestone.evidence_count} files
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${milestone.completion_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 text-center">{milestone.completion_percentage}%</p>
                  </div>
                </div>

                {/* Evidence Upload */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    {milestone.status === 'approved' ? 'View Evidence' : 'Upload Evidence'}
                  </h5>
                  <div className="flex items-center space-x-4">
                    {milestone.status === 'approved' ? (
                      <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <FileText className="h-4 w-4 mr-2" />
                        View Evidence Files
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              queueFile(milestone.id, file)
                            }
                          }}
                          disabled={uploading}
                        />
                        <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </div>
                      </label>
                    )}
                    {milestone.status !== 'approved' && (
                      <div className="text-sm text-gray-700">
                        {queuedFiles[milestone.id] && queuedFiles[milestone.id].length > 0 ? (
                          <div>
                            <p className="text-gray-600 mb-1">Files to be submitted:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {queuedFiles[milestone.id].map((f, idx) => (
                                <li key={idx} className="flex items-center justify-between">
                                  <span>{f.name}</span>
                                  <button
                                    onClick={() => removeQueuedFile(milestone.id, idx)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Upload documents, photos, or other evidence</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Notes */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Your Notes</h5>
                  <textarea
                    value={vendorNotes[milestone.id] || ''}
                    onChange={(e) => setVendorNotes(prev => ({
                      ...prev,
                      [milestone.id]: e.target.value
                    }))}
                    onBlur={() => handleNotesUpdate(milestone.id, vendorNotes[milestone.id] || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add your notes, comments, or updates about this milestone..."
                  />
                </div>

                {/* Submit Button */}
                {(milestone.status === 'not_started' || milestone.status === 'in_progress' || milestone.status === 'rejected') && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {milestone.status === 'rejected' ? 'Resubmit for Review?' : 'Ready to Submit?'}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {milestone.status === 'rejected' 
                            ? 'Address the feedback above and resubmit your evidence for review.'
                            : 'Upload your evidence and submit for review when ready.'
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => handleSubmitMilestone(milestone.id)}
                        disabled={submitting}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          milestone.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {milestones.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Yet</h3>
            <p className="text-gray-600">Milestones will appear here once they are created by the project manager.</p>
          </div>
        )}
      </div>
    </div>
  )
}
