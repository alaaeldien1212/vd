'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Calendar, Plus, Trash2 } from 'lucide-react'

interface NewScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onScheduleCreated: () => void
  projectId?: string
}

interface Project {
  id: string
  name: string
}

interface ScheduleActivity {
  id: string
  name: string
  description: string
  activity_type: string
  start_date: string
  end_date: string
  duration_days: number
  progress_percentage: number
  dependencies: string[]
}

export default function NewScheduleModal({ isOpen, onClose, onScheduleCreated, projectId }: NewScheduleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: projectId || '',
    start_date: '',
    end_date: ''
  })
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      if (projectId) {
        setFormData(prev => ({ ...prev, project_id: projectId }))
      }
    }
  }, [isOpen, projectId])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const addActivity = () => {
    const newActivity: ScheduleActivity = {
      id: Date.now().toString(),
      name: '',
      description: '',
      activity_type: 'task',
      start_date: '',
      end_date: '',
      duration_days: 0,
      progress_percentage: 0,
      dependencies: []
    }
    setActivities(prev => [...prev, newActivity])
  }

  const updateActivity = (id: string, field: keyof ScheduleActivity, value: any) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === id) {
        const updatedActivity = { ...activity, [field]: value }
        // Ensure activity_type is always set
        if (field === 'activity_type' && !updatedActivity.activity_type) {
          updatedActivity.activity_type = 'task'
        }
        return updatedActivity
      }
      return activity
    }))
  }

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Schedule name is required'
    }

    if (!formData.project_id) {
      newErrors.project_id = 'Project is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (activities.length === 0) {
      newErrors.activities = 'At least one activity is required'
    }

    // Validate activities
    activities.forEach((activity, index) => {
      if (!activity.name || !activity.name.trim()) {
        newErrors[`activity_${index}_name`] = 'Activity name is required'
      }
      if (!activity.activity_type || !activity.activity_type.trim()) {
        newErrors[`activity_${index}_type`] = 'Activity type is required'
      }
      if (activity.start_date && activity.end_date) {
        const startDate = new Date(activity.start_date)
        const endDate = new Date(activity.end_date)
        
        if (startDate >= endDate) {
          newErrors[`activity_${index}_end_date`] = 'End date must be after start date'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('project_schedules')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          project_id: formData.project_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: 'draft'
        })
        .select()

      if (scheduleError) throw scheduleError

      const scheduleId = scheduleData[0].id

      // Create activities
      if (activities.length > 0) {
        const activitiesData = activities.map(activity => ({
          schedule_id: scheduleId,
          name: activity.name?.trim() || '',
          description: activity.description?.trim() || null,
          activity_type: activity.activity_type || 'task',
          start_date: activity.start_date || null,
          end_date: activity.end_date || null,
          duration_days: activity.duration_days || 0,
          progress_percentage: activity.progress_percentage || 0,
          status: 'not_started'
        }))

        const { error: activitiesError } = await supabase
          .from('schedule_activities')
          .insert(activitiesData)

        if (activitiesError) throw activitiesError
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        project_id: projectId || '',
        start_date: '',
        end_date: ''
      })
      setActivities([])
      setErrors({})

      onScheduleCreated()
      onClose()
    } catch (error) {
      console.error('Error creating schedule:', error)
      setErrors({ submit: 'Failed to create schedule. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Schedule</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Schedule Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter schedule name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.project_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter schedule description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
              </div>
            </div>

            {/* Activities */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Activities</h4>
                <button
                  type="button"
                  onClick={addActivity}
                  className="btn-secondary text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </button>
              </div>

              {activities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No activities added yet. Click "Add Activity" to get started.
                </div>
              )}

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-sm font-medium text-gray-900">Activity {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Activity Name *
                        </label>
                        <input
                          type="text"
                          value={activity.name || ''}
                          onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                            errors[`activity_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter activity name"
                        />
                        {errors[`activity_${index}_name`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`activity_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Activity Type *
                        </label>
                        <select
                          value={activity.activity_type || 'task'}
                          onChange={(e) => updateActivity(activity.id, 'activity_type', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                            errors[`activity_${index}_type`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="task">Task</option>
                          <option value="milestone">Milestone</option>
                          <option value="deliverable">Deliverable</option>
                          <option value="meeting">Meeting</option>
                        </select>
                        {errors[`activity_${index}_type`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`activity_${index}_type`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Duration (days)
                        </label>
                        <input
                          type="number"
                          value={activity.duration_days || 0}
                          onChange={(e) => updateActivity(activity.id, 'duration_days', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Progress (%)
                        </label>
                        <input
                          type="number"
                          value={activity.progress_percentage || 0}
                          onChange={(e) => updateActivity(activity.id, 'progress_percentage', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={activity.start_date || ''}
                          onChange={(e) => updateActivity(activity.id, 'start_date', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={activity.end_date || ''}
                          onChange={(e) => updateActivity(activity.id, 'end_date', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                            errors[`activity_${index}_end_date`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`activity_${index}_end_date`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`activity_${index}_end_date`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={activity.description || ''}
                        onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter activity description"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors.activities && (
                <p className="mt-2 text-sm text-red-600">{errors.activities}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="text-red-600 text-sm">{errors.submit}</div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
