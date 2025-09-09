'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import NewScheduleModal from '@/components/NewScheduleModal'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  GanttChart,
  BarChart3,
  Users,
  Filter
} from 'lucide-react'

interface ScheduleActivity {
  id: string
  name: string
  description: string | null
  activity_type: string
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  progress_percentage: number
  status: string
  priority: string
  assigned_to: string | null
  milestone_id: string | null
  assigned_user_name: string | null
}

interface ProjectSchedule {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: string
  project_name: string
  activities: ScheduleActivity[]
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ProjectSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<ProjectSchedule | null>(null)
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'calendar'>('list')

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('project_schedules')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          projects!inner(name)
        `)

      if (scheduleError) throw scheduleError

      // Fetch activities for each schedule
      const schedulesWithActivities = await Promise.all(
        (scheduleData || []).map(async (schedule) => {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('schedule_activities')
            .select(`
              id,
              name,
              description,
              activity_type,
              start_date,
              end_date,
              duration_days,
              progress_percentage,
              status,
              priority,
              assigned_to,
              milestone_id,
              users!schedule_activities_assigned_to_fkey(first_name, last_name)
            `)
            .eq('schedule_id', schedule.id)
            .order('start_date', { ascending: true })

          if (activitiesError) throw activitiesError

          return {
            ...schedule,
            project_name: schedule.projects.name,
            activities: activitiesData?.map(activity => ({
              ...activity,
              assigned_user_name: activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : null
            })) || []
          }
        })
      )

      setSchedules(schedulesWithActivities)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-500" />
      case 'on_hold': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const handleScheduleCreated = () => {
    // Refresh schedules data after schedule creation
    fetchSchedules()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateScheduleProgress = (activities: ScheduleActivity[]) => {
    if (activities.length === 0) return 0
    const totalWeight = activities.reduce((sum, activity) => sum + (activity.duration_days || 0), 0)
    const completedWeight = activities.reduce((sum, activity) => 
      sum + ((activity.duration_days || 0) * activity.progress_percentage / 100), 0
    )
    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
              <p className="text-gray-600 mt-1">Project timelines and activity tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <GanttChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            <button 
              onClick={() => setShowNewScheduleModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Schedules List */}
        <div className="space-y-6">
          {schedules.map((schedule) => {
            const progress = calculateScheduleProgress(schedule.activities)
            const overdueActivities = schedule.activities.filter(activity => 
              activity.end_date && new Date(activity.end_date) < new Date() && activity.status !== 'completed'
            ).length

            return (
              <div key={schedule.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{schedule.project_name}</p>
                      {schedule.description && (
                        <p className="text-sm text-gray-500 mt-2">{schedule.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="text-lg font-semibold text-gray-900">{progress.toFixed(1)}%</div>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      <span>{schedule.activities.length} Activities</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>{schedule.activities.filter(a => a.status === 'completed').length} Completed</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className={overdueActivities > 0 ? 'text-red-600' : ''}>{overdueActivities} Overdue</span>
                    </div>
                  </div>

                  {/* Activities List */}
                  <div className="space-y-2">
                    {schedule.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(activity.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{activity.name}</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(activity.priority)}`}>
                                {activity.priority.toUpperCase()}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              {activity.start_date && activity.end_date && (
                                <span>
                                  {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
                                </span>
                              )}
                              {activity.duration_days && (
                                <span>{activity.duration_days} days</span>
                              )}
                              {activity.assigned_user_name && (
                                <span>Assigned to: {activity.assigned_user_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{activity.progress_percentage}%</div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${activity.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-gray-500 text-lg mt-4">No schedules found</div>
            <p className="text-gray-400 mt-2">Create your first project schedule to get started</p>
          </div>
        )}
      </main>

      {/* New Schedule Modal */}
      <NewScheduleModal
        isOpen={showNewScheduleModal}
        onClose={() => setShowNewScheduleModal(false)}
        onScheduleCreated={handleScheduleCreated}
      />
    </div>
  )
}
