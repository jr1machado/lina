import request from '@/utils/request'

export function getReportTemplates() {
  return request({ url: '/api/v1/reports-center/templates/', method: 'get' })
}

export function generateReport(data) {
  return request({ url: '/api/v1/reports-center/generate/', method: 'post', data })
}

export function getReportRuns(params) {
  return request({ url: '/api/v1/reports-center/runs/', method: 'get', params })
}

export function getReportRun(id) {
  return request({ url: `/api/v1/reports-center/runs/${id}/`, method: 'get' })
}

export function deleteReportRun(id) {
  return request({ url: `/api/v1/reports-center/runs/${id}/`, method: 'delete' })
}

export function downloadReportRunUrl(id) {
  return `/api/v1/reports-center/runs/${id}/download/`
}

export function getReportSchedules(params) {
  return request({ url: '/api/v1/reports-center/schedules/', method: 'get', params })
}

export function createReportSchedule(data) {
  return request({ url: '/api/v1/reports-center/schedules/', method: 'post', data })
}

export function updateReportSchedule(id, data) {
  return request({ url: `/api/v1/reports-center/schedules/${id}/`, method: 'patch', data })
}

export function deleteReportSchedule(id) {
  return request({ url: `/api/v1/reports-center/schedules/${id}/`, method: 'delete' })
}

export function getNodes(params) {
  return request({ url: '/api/v1/assets/nodes/', method: 'get', params: { limit: 100, ...params } })
}

export function getReportBranding() {
  return request({ url: '/api/v1/reports-center/branding/', method: 'get' })
}

export function uploadReportBranding(file) {
  const formData = new FormData()
  formData.append('logo', file)
  return request({
    url: '/api/v1/reports-center/branding/',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteReportBranding() {
  return request({ url: '/api/v1/reports-center/branding/', method: 'delete' })
}

export function reportBrandingImageUrl() {
  return '/api/v1/reports-center/branding/image/'
}
