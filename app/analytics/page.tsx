'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, TrendingUp, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  totalProjects: number
  totalBudget: number
  completionRate: number
  overdueMilestones: number
  activeVendors: number
  monthlyData: Array<{
    month: string
    projects: number
    budget: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalProjects: 0,
    totalBudget: 0,
    completionRate: 0,
    overdueMilestones: 0,
    activeVendors: 0,
    monthlyData: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch project overview data
      const { data: projectData, error: projectError } = await supabase
        .from('project_overview')
        .select('*')

      if (projectError) throw projectError

      // Calculate analytics
      const totalProjects = projectData?.length || 0
      const totalBudget = projectData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0
      const totalMilestones = projectData?.reduce((sum, p) => sum + (p.total_milestones || 0), 0) || 0
      const completedMilestones = projectData?.reduce((sum, p) => sum + (p.completed_percentage || 0), 0) || 0
      const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
      const overdueMilestones = projectData?.reduce((sum, p) => sum + (p.overdue_milestones || 0), 0) || 0

      // Fetch active vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_performance')
        .select('vendor_id')
        .gt('total_milestones', 0)

      if (vendorError) throw vendorError

      // Generate monthly data (last 6 months)
      const monthlyData = generateMonthlyData(projectData || [])

      setData({
        totalProjects,
        totalBudget,
        completionRate,
        overdueMilestones,
        activeVendors: vendorData?.length || 0,
        monthlyData
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (projects: any[]) => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const monthProjects = projects.filter(p => {
        const projectDate = new Date(p.created_at)
        return projectDate.getMonth() === date.getMonth() && 
               projectDate.getFullYear() === date.getFullYear()
      })
      
      months.push({
        month: monthName,
        projects: monthProjects.length,
        budget: monthProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
      })
    }
    
    return months
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Project performance and insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{data.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{data.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue Milestones</p>
                <p className="text-2xl font-semibold text-gray-900">{data.overdueMilestones}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Projects Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Projects Created by Month</h3>
            <div className="space-y-4">
              {data.monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(month.projects / Math.max(...data.monthlyData.map(m => m.projects))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{month.projects}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Distribution</h3>
            <div className="space-y-4">
              {data.monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(month.budget / Math.max(...data.monthlyData.map(m => m.budget), 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      {formatCurrency(month.budget)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Performance</h3>
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Vendor performance data will be available soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
