import request from '@/utils/request'

export function getRiskSummary(params) {
  return request({
    url: '/api/v1/risk/summary/',
    method: 'get',
    params
  })
}

export function getRiskFindings(params) {
  return request({
    url: '/api/v1/risk/findings/',
    method: 'get',
    params
  })
}

export function updateRiskFinding(id, data) {
  return request({
    url: `/api/v1/risk/findings/${id}/`,
    method: 'patch',
    data
  })
}

export function getKriSummary(params) {
  return request({
    url: '/api/v1/kri/summary/',
    method: 'get',
    params
  })
}

export function getRiskAccounts(params) {
  return request({
    url: '/api/v1/risk/accounts/',
    method: 'get',
    params
  })
}

export function getKriHistory(params) {
  return request({
    url: '/api/v1/kri/history/',
    method: 'get',
    params
  })
}
