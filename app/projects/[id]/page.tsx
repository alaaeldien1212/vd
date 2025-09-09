'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NewMilestoneModal from '@/components/NewMilestoneModal'
import ViewEvidenceModal from '@/components/ViewEvidenceModal'
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Upload,
  FileText,
  Users,
  GanttChart,
  BarChart3
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  budget: number
  currency: string
  client_name: string
  project_manager_name: string
  total_purchase_orders: number
  total_milestones: number
  completed_percentage: number
  overdue_milestones: number
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
  vendor_notes?: string
  rejection_reason?: string
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
  status: string
}

interface PurchaseOrder {
  id: string
  po_number: string
  title: string
  description: string
  total_amount: number
  currency: string
  status: string
  issue_date: string
  expected_delivery_date: string
  vendor_name: string
  created_at: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [scheduleActivities, setScheduleActivities] = useState<ScheduleActivity[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'schedule' | 'purchase-orders'>('overview')
  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false)
  const [showViewEvidenceModal, setShowViewEvidenceModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      console.log('Fetching project data for project:', projectId)
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('project_overview')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      console.log('Project data fetched:', projectData)
      setProject(projectData)

      // Fetch milestones
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
      
      const formattedMilestones = milestonesData.map(milestone => ({
        ...milestone,
        evidence_count: milestone.milestone_evidence?.[0]?.count || 0
      }))
      setMilestones(formattedMilestones)

      // Fetch schedule activities
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('project_schedules')
        .select(`
          id,
          schedule_activities(
            id,
            name,
            description,
            activity_type,
            start_date,
            end_date,
            duration_days,
            progress_percentage,
            status
          )
        `)
        .eq('project_id', projectId)

      if (scheduleError) {
        console.warn('No schedule found for project:', scheduleError)
        setScheduleActivities([])
      } else {
        setScheduleActivities(scheduleData?.[0]?.schedule_activities || [])
      }

      // Fetch purchase orders
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          title,
          description,
          total_amount,
          currency,
          status,
          issue_date,
          expected_delivery_date,
          created_at,
          organizations!inner(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (poError) {
        console.warn('No purchase orders found for project:', poError)
        setPurchaseOrders([])
      } else {
        const formattedPOs = poData?.map(po => ({
          ...po,
          vendor_name: (po.organizations as any)?.name || 'Unknown Vendor'
        })) || []
        setPurchaseOrders(formattedPOs)
      }

    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateVendorUrl = () => {
    if (!project) return ''
    const baseUrl = window.location.origin
    const vendorToken = btoa('vendor_' + projectId + '_' + Date.now())
    return baseUrl + '/vendor/' + vendorToken
  }

  const copyVendorUrl = async () => {
    const url = generateVendorUrl()
    try {
      await navigator.clipboard.writeText(url)
      alert('Vendor URL copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleMilestoneCreated = () => {
    console.log('Milestone created, refreshing project data...')
    fetchProjectData() // Refresh project data after milestone creation
  }

  const handleViewEvidence = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setShowViewEvidenceModal(true)
  }

  const handleStatusUpdate = (milestoneId: string, status: string) => {
    setMilestones(prev => prev.map(m => 
      m.id === milestoneId ? { ...m, status } : m
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600">The project you're looking for doesn't exist.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={copyVendorUrl}
                className="btn-secondary flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Copy Vendor URL
              </button>
              <button 
                onClick={() => setShowNewMilestoneModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={'py-4 px-1 border-b-2 font-medium text-sm ' + (activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={'py-4 px-1 border-b-2 font-medium text-sm ' + (activeTab === 'milestones' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
            >
              Milestones ({milestones.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={'py-4 px-1 border-b-2 font-medium text-sm ' + (activeTab === 'schedule' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
            >
              Schedule ({scheduleActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className={'py-4 px-1 border-b-2 font-medium text-sm ' + (activeTab === 'purchase-orders' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{project.completed_percentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Milestones</p>
                    <p className="text-2xl font-bold text-gray-900">{project.total_milestones}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">{project.overdue_milestones}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-gray-900">{project.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Project Manager</p>
                  <p className="text-gray-900">{project.project_manager_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-gray-900">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-gray-900">{new Date(project.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-gray-900">{project.currency} {project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (
                    project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'active' ? 'bg-green-100 text-green-800' : 
                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                    project.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                    project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
              <button 
                onClick={() => setShowNewMilestoneModal(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Milestone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {milestones.map((milestone) => (
                      <tr key={milestone.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{milestone.name}</div>
                            <div className="text-sm text-gray-500">{milestone.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(milestone.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: milestone.completion_percentage + '%' }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{milestone.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (
                            milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'approved' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'pending_completion_review' ? 'bg-yellow-100 text-yellow-800' :
                            milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            milestone.status === 'started' ? 'bg-blue-100 text-blue-800' :
                            milestone.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            milestone.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {milestone.evidence_count} files
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            Edit
                          </button>
                          <button 
                            onClick={() => handleViewEvidence(milestone)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Project Schedule</h3>
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduleActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                            <div className="text-sm text-gray-500">{activity.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {activity.activity_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.duration_days} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: activity.progress_percentage + '%' }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{activity.progress_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (activity.status === 'completed' ? 'bg-green-100 text-green-800' : activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>
                            {activity.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Delivery
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No purchase orders found for this project.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{po.title}</div>
                            {po.description && (
                              <div className="text-sm text-gray-500 mt-1">{po.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {po.vendor_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {po.currency} {po.total_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (
                              po.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              po.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                              po.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                              po.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                              po.status === 'completed' ? 'bg-green-100 text-green-800' :
                              po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {po.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {po.issue_date ? new Date(po.issue_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Milestone Modal */}
      <NewMilestoneModal
        isOpen={showNewMilestoneModal}
        onClose={() => setShowNewMilestoneModal(false)}
        onMilestoneCreated={handleMilestoneCreated}
        projectId={projectId}
      />

      {/* View Evidence Modal */}
      <ViewEvidenceModal
        isOpen={showViewEvidenceModal}
        onClose={() => setShowViewEvidenceModal(false)}
        milestone={selectedMilestone}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}