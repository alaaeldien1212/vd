'use client'

import { useState, useEffect } from 'react'
import { X, Download, Eye, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Evidence {
  id: string
  milestone_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
  description: string
  uploaded_by: string
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
  vendor_notes?: string
  rejection_reason?: string
}

interface ViewEvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  milestone: Milestone | null
  onStatusUpdate: (milestoneId: string, status: string) => void
}

export default function ViewEvidenceModal({ 
  isOpen, 
  onClose, 
  milestone, 
  onStatusUpdate 
}: ViewEvidenceModalProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionField, setShowRejectionField] = useState(false)

  useEffect(() => {
    if (isOpen && milestone) {
      fetchEvidence()
    }
  }, [isOpen, milestone])

  const fetchEvidence = async () => {
    if (!milestone) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('milestone_evidence')
        .select('*')
        .eq('milestone_id', milestone.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvidence(data || [])
    } catch (error) {
      console.error('Error fetching evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!milestone) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('milestones')
        .update({ 
          status: 'approved',
          completion_percentage: 100
        })
        .eq('id', milestone.id)

      if (error) throw error

      onStatusUpdate(milestone.id, 'approved')
      onClose()
      alert('Milestone approved successfully!')
    } catch (error) {
      console.error('Error approving milestone:', error)
      alert('Failed to approve milestone. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!milestone) return

    if (!showRejectionField) {
      setShowRejectionField(true)
      return
    }

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('milestones')
        .update({ 
          status: 'rejected',
          completion_percentage: 0,
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', milestone.id)

      if (error) throw error

      onStatusUpdate(milestone.id, 'rejected')
      onClose()
      alert('Milestone rejected. Vendor will need to resubmit.')
    } catch (error) {
      console.error('Error rejecting milestone:', error)
      alert('Failed to reject milestone. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  if (!isOpen || !milestone) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Milestone Evidence Review</h2>
            <p className="text-gray-600 mt-1">{milestone.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Milestone Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Milestone Details</h3>
                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Due: {new Date(milestone.due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Status</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  milestone.status === 'pending_completion_review' ? 'bg-yellow-100 text-yellow-800' :
                  milestone.status === 'approved' ? 'bg-green-100 text-green-800' :
                  milestone.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {milestone.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor Notes */}
          {milestone.vendor_notes && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Vendor Notes</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{milestone.vendor_notes}</p>
              </div>
            </div>
          )}

          {/* Evidence Files */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Evidence Files ({evidence.length})</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading evidence...</p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No evidence files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('evidence-files')
                            .getPublicUrl(file.file_path)
                          window.open(data.publicUrl, '_blank')
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('evidence-files')
                            .getPublicUrl(file.file_path)
                          const link = document.createElement('a')
                          link.href = data.publicUrl
                          link.download = file.file_name
                          link.click()
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rejection Reason Field */}
        {showRejectionField && (
          <div className="p-6 border-t border-gray-200 bg-red-50">
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-red-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this milestone..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectionField(false)
                  setRejectionReason('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={updating || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {updating ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {milestone.status === 'pending_completion_review' && !showRejectionField && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReject}
              disabled={updating}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {updating ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={handleApprove}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {updating ? 'Processing...' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
