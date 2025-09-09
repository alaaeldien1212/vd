'use client'

import { useState } from 'react'
import { format, differenceInDays, addDays } from 'date-fns'

interface GanttActivity {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  progress_percentage: number
  status: string
  priority: string
  assigned_user_name: string | null
}

interface ScheduleGanttProps {
  activities: GanttActivity[]
  startDate: string
  endDate: string
}

export default function ScheduleGantt({ activities, startDate, endDate }: ScheduleGanttProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const projectStart = new Date(startDate)
  const projectEnd = new Date(endDate)
  const totalDays = differenceInDays(projectEnd, projectStart) + 1

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'not_started': return 'bg-gray-300'
      default: return 'bg-gray-300'
    }
  }

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500'
      case 'high': return 'border-orange-500'
      case 'medium': return 'border-yellow-500'
      case 'low': return 'border-green-500'
      default: return 'border-gray-300'
    }
  }

  const calculateActivityPosition = (activityStart: string, activityEnd: string) => {
    const start = new Date(activityStart)
    const end = new Date(activityEnd)
    
    const daysFromStart = differenceInDays(start, projectStart)
    const duration = differenceInDays(end, start) + 1
    
    return {
      left: (daysFromStart / totalDays) * 100,
      width: (duration / totalDays) * 100
    }
  }

  const generateTimelineDays = () => {
    const days = []
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(projectStart, i)
      days.push(date)
    }
    return days
  }

  const timelineDays = generateTimelineDays()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Gantt Chart View</h3>
        <p className="text-sm text-gray-600">Timeline visualization of project activities</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200">
            <div className="w-64 p-3 bg-gray-50 border-r border-gray-200">
              <span className="text-sm font-medium text-gray-700">Activity</span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {timelineDays.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 min-w-8 p-2 text-center border-r border-gray-200"
                  >
                    <div className="text-xs text-gray-600">
                      {format(date, 'MMM')}
                    </div>
                    <div className="text-xs font-medium text-gray-900">
                      {format(date, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-1">
            {activities.map((activity) => {
              if (!activity.start_date || !activity.end_date) return null
              
              const position = calculateActivityPosition(activity.start_date, activity.end_date)
              const isOverdue = new Date(activity.end_date) < new Date() && activity.status !== 'completed'
              
              return (
                <div
                  key={activity.id}
                  className="flex border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* Activity Name */}
                  <div className="w-64 p-3 border-r border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`}></div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {activity.name}
                      </span>
                    </div>
                    {activity.assigned_user_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.assigned_user_name}
                      </div>
                    )}
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative p-3">
                    <div className="relative h-8">
                      {/* Background */}
                      <div className="absolute inset-0 bg-gray-100 rounded"></div>
                      
                      {/* Activity Bar */}
                      <div
                        className={`absolute top-1 bottom-1 rounded border-2 ${getPriorityBorder(activity.priority)} ${getStatusColor(activity.status)} ${
                          selectedActivity === activity.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                        }}
                        onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                      >
                        {/* Progress Bar */}
                        <div
                          className="h-full bg-white bg-opacity-30 rounded"
                          style={{ width: `${100 - activity.progress_percentage}%` }}
                        ></div>
                        
                        {/* Activity Label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white truncate px-1">
                            {activity.progress_percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Overdue Indicator */}
                      {isOverdue && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>On Hold</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>
    </div>
  )
}
