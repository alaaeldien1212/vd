'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Calendar, FileText, Percent, AlertCircle } from 'lucide-react'

interface NewMilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  onMilestoneCreated: () => void
  projectId: string
}

interface MilestoneTemplate {
  id: string
  name: string
  description: string
  default_weight_percentage: number
  default_evidence_required: boolean
}

export default function NewMilestoneModal({ isOpen, onClose, onMilestoneCreated, projectId }: NewMilestoneModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    weight_percentage: 0,
    evidence_required: false
  })
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      // Reset form when modal opens
      setFormData({
        name: '',
        description: '',
        due_date: '',
        weight_percentage: 0,
        evidence_required: false
      })
      setSelectedTemplate('')
      setErrors({})
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('milestone_templates')
        .select('*')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        due_date: '',
        weight_percentage: template.default_weight_percentage,
        evidence_required: template.default_evidence_required
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required'
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }
    if (formData.weight_percentage <= 0 || formData.weight_percentage > 100) {
      newErrors.weight_percentage = 'Weight percentage must be between 1 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          project_id: projectId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date,
          weight_percentage: formData.weight_percentage,
          evidence_required: formData.evidence_required,
          status: 'in_progress',
          completion_percentage: 0
        })
        .select()

      if (error) throw error

      console.log('Milestone created successfully:', data)

      // Check if this is the first milestone and update project status to 'active'
      console.log('Checking if this is the first milestone for project:', projectId)
      const { data: existingMilestones, error: countError } = await supabase
        .from('milestones')
        .select('id')
        .eq('project_id', projectId)

      console.log('Existing milestones count:', existingMilestones?.length)

      if (countError) {
        console.error('Error checking existing milestones:', countError)
      } else if (existingMilestones && existingMilestones.length === 1) {
        console.log('This is the first milestone, updating project status to active')
        // This is the first milestone, update project status to 'active'
        const { error: updateError } = await supabase
          .from('projects')
          .update({ status: 'active' })
          .eq('id', projectId)

        if (updateError) {
          console.error('Error updating project status:', updateError)
        } else {
          console.log('Project status successfully updated to active')
        }
      } else {
        console.log('Not the first milestone, skipping status update')
      }

      // Call the callback after all updates are complete
      onMilestoneCreated()
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        due_date: '',
        weight_percentage: 0,
        evidence_required: false
      })
      setSelectedTemplate('')

    } catch (error) {
      console.error('Error creating milestone:', error)
      alert('Failed to create milestone. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Milestone</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Milestone Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milestone Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter milestone name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter milestone description"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.due_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.due_date}
              </p>
            )}
          </div>

          {/* Weight Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={formData.weight_percentage}
                onChange={(e) => handleInputChange('weight_percentage', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.weight_percentage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            {errors.weight_percentage && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.weight_percentage}
              </p>
            )}
          </div>

          {/* Evidence Required */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="evidence_required"
              checked={formData.evidence_required}
              onChange={(e) => handleInputChange('evidence_required', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="evidence_required" className="ml-2 block text-sm text-gray-700">
              Evidence required for completion
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
