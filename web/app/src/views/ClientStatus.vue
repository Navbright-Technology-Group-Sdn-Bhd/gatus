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
                <CardTitle class="text-sm font-medium text-muted-foreground">Monitor Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ groupedEndpoints.length }}</div>
              </CardContent>
            </Card>
          </div>

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
