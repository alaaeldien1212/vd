'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import NewProjectModal from '@/components/NewProjectModal'
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Building2
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  totalPOs: number
  totalMilestones: number
  completedMilestones: number
  overdueMilestones: number
  totalBudget: number
  activeVendors: number
  completionRate: number
}

interface ProjectOverview {
  id: string
  name: string
  status: string
  completed_percentage: number
  total_milestones: number
  overdue_milestones: number
  client_name: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalPOs: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    overdueMilestones: 0,
    totalBudget: 0,
    activeVendors: 0,
    completionRate: 0
  })
  const [projects, setProjects] = useState<ProjectOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch project overview data
      const { data: projectData, error: projectError } = await supabase
        .from('project_overview')
        .select('*')

      if (projectError) throw projectError

      // Calculate stats
      const totalProjects = projectData?.length || 0
      const totalPOs = projectData?.reduce((sum, p) => sum + (p.total_purchase_orders || 0), 0) || 0
      const totalMilestones = projectData?.reduce((sum, p) => sum + (p.total_milestones || 0), 0) || 0
      const completedMilestones = projectData?.reduce((sum, p) => sum + (p.completed_percentage || 0), 0) || 0
      const overdueMilestones = projectData?.reduce((sum, p) => sum + (p.overdue_milestones || 0), 0) || 0
      const totalBudget = projectData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0
      const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

      // Fetch active vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_performance')
        .select('vendor_id')
        .gt('total_milestones', 0)

      if (vendorError) throw vendorError

      setStats({
        totalProjects,
        totalPOs,
        totalMilestones,
        completedMilestones,
        overdueMilestones,
        totalBudget,
        activeVendors: vendorData?.length || 0,
        completionRate
      })

      setProjects(projectData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    // Refresh dashboard data after project creation
    fetchDashboardData()
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    subtitle 
  }: { 
    title: string
    value: string | number
    icon: any
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    subtitle?: string
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold text-gray-900">Milestone Tracker</h1>
              <p className="text-gray-600 mt-1">Procurement & Construction Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="btn-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Purchase Orders"
            value={stats.totalPOs}
            icon={FileText}
            color="purple"
          />
          <StatCard
            title="Total Milestones"
            value={stats.totalMilestones}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate.toFixed(1)}%`}
            icon={TrendingUp}
            color="green"
            subtitle={`${stats.completedMilestones} completed`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Overdue Milestones"
            value={stats.overdueMilestones}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Total Budget"
            value={`$${(stats.totalBudget / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Active Vendors"
            value={stats.activeVendors}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="In Progress"
            value={stats.totalMilestones - stats.completedMilestones}
            icon={Clock}
            color="yellow"
            subtitle="milestones"
          />
        </div>

        {/* Projects Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Projects Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Milestones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.client_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                        project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.completed_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{project.completed_percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.total_milestones}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.overdue_milestones > 0 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {project.overdue_milestones}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}
