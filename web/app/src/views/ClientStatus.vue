<template>
  <div class="dashboard-container bg-background">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="mb-6">
        <Button variant="ghost" class="mb-4" @click="goBack">
          <ArrowLeft class="h-4 w-4 mr-2" />
          Back to Client Pages
        </Button>

        <div v-if="client" class="space-y-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="text-4xl font-bold tracking-tight">{{ client.title }}</h1>
              <p class="font-mono text-muted-foreground mt-2 break-all">{{ client.domain }}</p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="overallStatus" />
              <Button variant="ghost" size="icon" @click="fetchData" title="Refresh data" :disabled="loading">
                <RefreshCw :class="['h-5 w-5', loading && 'animate-spin']" />
              </Button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ overallStatusLabel }}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Healthy Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ healthyCount }} / {{ relatedEndpoints.length }}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Last Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ lastCheckTime }}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ availabilityPercent }}</div>
              </CardContent>
            </Card>
          </div>

          <Card v-if="relatedEndpoints.length > 0">
            <CardHeader>
              <CardTitle>Service Availability Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div :class="['rounded-md border p-4', summaryToneClass]">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="text-lg font-semibold">{{ serviceSummaryTitle }}</p>
                      <p class="text-sm mt-1">{{ serviceSummaryDescription }}</p>
                    </div>
                    <StatusBadge :status="overallStatus" />
                  </div>
                </div>

                <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div
                    v-for="summary in serviceSummaries"
                    :key="summary.name"
                    class="rounded-md border p-3 bg-background"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-medium">{{ summary.name }}</p>
                        <p class="text-xs text-muted-foreground mt-1">
                          {{ summary.healthy }} / {{ summary.total }} healthy
                        </p>
                      </div>
                      <StatusBadge :status="summary.status" />
                    </div>
                    <div v-if="summary.unhealthyNames.length" class="mt-3 text-xs text-red-600 dark:text-red-400">
                      {{ summary.unhealthyNames.join(', ') }}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div v-if="loading && relatedEndpoints.length === 0" class="flex items-center justify-center py-20">
            <Loading size="lg" />
          </div>

          <div v-else-if="relatedEndpoints.length === 0" class="text-center py-20">
            <AlertCircle class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-semibold mb-2">No monitors found</h3>
            <p class="text-muted-foreground">No configured monitors match this client page.</p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="group in groupedEndpoints" :key="group.name" class="space-y-3">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">{{ group.name }}</h2>
                <span class="text-sm text-muted-foreground">{{ group.items.length }} check{{ group.items.length === 1 ? '' : 's' }}</span>
              </div>
              <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <EndpointCard
                  v-for="endpoint in group.items"
                  :key="endpoint.key"
                  :endpoint="endpoint"
                  :maxResults="resultPageSize"
                  :showAverageResponseTime="showAverageResponseTime"
                  @showTooltip="showTooltip"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20">
          <AlertCircle class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 class="text-2xl font-bold mb-2">Client page not found</h1>
          <p class="text-muted-foreground">This client status page is not configured.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import EndpointCard from '@/components/EndpointCard.vue'
import Loading from '@/components/Loading.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { generatePrettyTimeAgo } from '@/utils/time'
import { getClientPageBySlug, getLatestResult, isEndpointForClient } from '@/utils/clientPages'

const route = useRoute()
const router = useRouter()
const emit = defineEmits(['showTooltip'])

const endpointStatuses = ref([])
const loading = ref(false)
const resultPageSize = 50
const showAverageResponseTime = ref(localStorage.getItem('gatus:show-average-response-time') !== 'false')

const client = computed(() => {
  return getClientPageBySlug(route.params.client)
})

const relatedEndpoints = computed(() => {
  return endpointStatuses.value.filter((endpoint) => isEndpointForClient(endpoint, client.value))
})

const healthyCount = computed(() => {
  return relatedEndpoints.value.filter((endpoint) => getLatestResult(endpoint)?.success).length
})

const unhealthyEndpoints = computed(() => {
  return relatedEndpoints.value.filter((endpoint) => !getLatestResult(endpoint)?.success)
})

const availabilityPercent = computed(() => {
  if (relatedEndpoints.value.length === 0) {
    return 'N/A'
  }
  return `${Math.round((healthyCount.value / relatedEndpoints.value.length) * 100)}%`
})

const overallStatus = computed(() => {
  if (relatedEndpoints.value.length === 0) {
    return 'unknown'
  }
  return healthyCount.value === relatedEndpoints.value.length ? 'healthy' : 'unhealthy'
})

const overallStatusLabel = computed(() => {
  if (overallStatus.value === 'healthy') {
    return 'Operational'
  }
  if (overallStatus.value === 'unhealthy') {
    return 'Issues Detected'
  }
  return 'Unknown'
})

const serviceSummaryTitle = computed(() => {
  if (overallStatus.value === 'healthy') {
    return 'All monitored services are available'
  }
  if (overallStatus.value === 'unhealthy') {
    return `${unhealthyEndpoints.value.length} check${unhealthyEndpoints.value.length === 1 ? '' : 's'} require attention`
  }
  return 'Availability has not been checked yet'
})

const serviceSummaryDescription = computed(() => {
  if (overallStatus.value === 'healthy') {
    return 'Website availability, SSL certificate, domain expiry, and DNS checks are currently healthy.'
  }
  if (unhealthyEndpoints.value.length > 0) {
    return unhealthyEndpoints.value.map((endpoint) => endpoint.name).join(', ')
  }
  return 'Waiting for the first monitoring result.'
})

const summaryToneClass = computed(() => {
  if (overallStatus.value === 'healthy') {
    return 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-900 dark:text-green-100'
  }
  if (overallStatus.value === 'unhealthy') {
    return 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-900 dark:text-red-100'
  }
  return 'bg-muted text-muted-foreground'
})

const lastCheckTime = computed(() => {
  const timestamps = relatedEndpoints.value
    .map((endpoint) => getLatestResult(endpoint)?.timestamp)
    .filter(Boolean)
    .map((timestamp) => new Date(timestamp).getTime())

  if (timestamps.length === 0) {
    return 'Never'
  }

  return generatePrettyTimeAgo(new Date(Math.max(...timestamps)).toISOString())
})

const groupedEndpoints = computed(() => {
  const groups = {}
  for (const endpoint of relatedEndpoints.value) {
    const group = endpoint.group || 'No Group'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(endpoint)
  }

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      items: groups[name].sort((a, b) => a.name.localeCompare(b.name)),
    }))
})

const serviceSummaries = computed(() => {
  return groupedEndpoints.value.map((group) => {
    const healthy = group.items.filter((endpoint) => getLatestResult(endpoint)?.success).length
    const unhealthyNames = group.items
      .filter((endpoint) => !getLatestResult(endpoint)?.success)
      .map((endpoint) => endpoint.name)
    return {
      name: group.name,
      healthy,
      total: group.items.length,
      unhealthyNames,
      status: healthy === group.items.length ? 'healthy' : 'unhealthy',
    }
  })
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/v1/endpoints/statuses?page=1&pageSize=200', {
      credentials: 'include',
    })
    if (response.status === 200) {
      endpointStatuses.value = await response.json()
    } else {
      console.error('[ClientStatus][fetchData] Error fetching endpoints:', await response.text())
    }
  } catch (error) {
    console.error('[ClientStatus][fetchData] Error:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/clients')
}

const showTooltip = (result, event, action = 'hover') => {
  emit('showTooltip', result, event, action)
}

watch(() => route.params.client, () => {
  if (endpointStatuses.value.length === 0) {
    fetchData()
  }
})

onMounted(fetchData)
</script>
