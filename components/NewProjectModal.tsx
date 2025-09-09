'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Calendar, DollarSign, Users, FileText, Plus } from 'lucide-react'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: () => void
}

interface Organization {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
}

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_organization_id: '',
    project_manager_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNewOrgModal, setShowNewOrgModal] = useState(false)
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    type: 'client',
    contact_email: '',
    contact_phone: '',
    address: '',
    country: '',
    tax_id: ''
  })
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({})

  // Load organizations and users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
      loadUsers()
    }
  }, [isOpen])

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('type', 'client')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('role', ['admin', 'project_manager'])
        .order('first_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleCreateOrganization = async () => {
    // Validate new organization data
    const newOrgErrors: Record<string, string> = {}
    if (!newOrgData.name.trim()) {
      newOrgErrors.name = 'Organization name is required'
    }
    if (!newOrgData.contact_email.trim()) {
      newOrgErrors.contact_email = 'Contact email is required'
    }
    if (newOrgData.contact_email && !/\S+@\S+\.\S+/.test(newOrgData.contact_email)) {
      newOrgErrors.contact_email = 'Please enter a valid email address'
    }

    setOrgErrors(newOrgErrors)
    if (Object.keys(newOrgErrors).length > 0) return

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: newOrgData.name.trim(),
          type: newOrgData.type,
          contact_email: newOrgData.contact_email.trim(),
          contact_phone: newOrgData.contact_phone.trim() || null,
          address: newOrgData.address.trim() || null,
          country: newOrgData.country.trim() || null,
          tax_id: newOrgData.tax_id.trim() || null
        })
        .select()

      if (error) throw error

      // Add to organizations list and select it
      const newOrg = data[0]
      setOrganizations(prev => [...prev, newOrg])
      setFormData(prev => ({ ...prev, client_organization_id: newOrg.id }))
      
      // Reset new org form
      setNewOrgData({
        name: '',
        type: 'client',
        contact_email: '',
        contact_phone: '',
        address: '',
        country: '',
        tax_id: ''
      })
      setOrgErrors({})
      setShowNewOrgModal(false)
      
      alert('Organization created successfully!')
    } catch (error) {
      console.error('Error creating organization:', error)
      setOrgErrors({ submit: 'Failed to create organization. Please try again.' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    console.log(`Date input ${name}:`, value)
    // Store the date as-is to avoid timezone conversion issues
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (!formData.client_organization_id) {
      newErrors.client_organization_id = 'Client organization is required'
    }

    if (!formData.project_manager_id) {
      newErrors.project_manager_id = 'Project manager is required'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number'
    }

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
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          client_organization_id: formData.client_organization_id,
          project_manager_id: formData.project_manager_id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          currency: formData.currency,
          status: 'planning'
        })
        .select()

      if (error) throw error

      // Generate vendor URL
      const vendorToken = btoa('vendor_' + data[0].id + '_' + Date.now())
      const vendorUrl = window.location.origin + '/vendor/' + vendorToken
      
      console.log('Project created successfully:', data)
      console.log('Vendor URL:', vendorUrl)
      
      // Copy vendor URL to clipboard
      try {
        await navigator.clipboard.writeText(vendorUrl)
        alert(`Project created successfully! Vendor URL copied to clipboard: ${vendorUrl}`)
      } catch (err) {
        alert(`Project created successfully! Vendor URL: ${vendorUrl}`)
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        client_organization_id: '',
        project_manager_id: '',
        start_date: '',
        end_date: '',
        budget: '',
        currency: 'USD'
      })
      setErrors({})

      onProjectCreated()
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      setErrors({ submit: 'Failed to create project. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
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
                placeholder="Enter project name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
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
                placeholder="Enter project description"
              />
            </div>

            {/* Client Organization */}
            <div>
              <label htmlFor="client_organization_id" className="block text-sm font-medium text-gray-700 mb-2">
                Client Organization *
              </label>
              <div className="flex space-x-2">
                <select
                  id="client_organization_id"
                  name="client_organization_id"
                  value={formData.client_organization_id}
                  onChange={handleInputChange}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.client_organization_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select client organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewOrgModal(true)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center"
                  title="Create new organization"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {errors.client_organization_id && <p className="mt-1 text-sm text-red-600">{errors.client_organization_id}</p>}
            </div>

            {/* Project Manager */}
            <div>
              <label htmlFor="project_manager_id" className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager *
              </label>
              <select
                id="project_manager_id"
                name="project_manager_id"
                value={formData.project_manager_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.project_manager_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select project manager</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </option>
                ))}
              </select>
              {errors.project_manager_id && <p className="mt-1 text-sm text-red-600">{errors.project_manager_id}</p>}
            </div>

            {/* Dates and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleDateChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.budget ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
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
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Organization Modal */}
      {showNewOrgModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Organization</h3>
                <button
                  onClick={() => setShowNewOrgModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={newOrgData.name}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      orgErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter organization name"
                  />
                  {orgErrors.name && <p className="mt-1 text-sm text-red-600">{orgErrors.name}</p>}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={newOrgData.contact_email}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      orgErrors.contact_email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact email"
                  />
                  {orgErrors.contact_email && <p className="mt-1 text-sm text-red-600">{orgErrors.contact_email}</p>}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={newOrgData.contact_phone}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter contact phone"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newOrgData.country}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter country"
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={newOrgData.tax_id}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, tax_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter tax ID"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={newOrgData.address}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter organization address"
                  />
                </div>

                {/* Error Message */}
                {orgErrors.submit && (
                  <div className="text-red-600 text-sm">{orgErrors.submit}</div>
                )}

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewOrgModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOrganization}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    Create Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
