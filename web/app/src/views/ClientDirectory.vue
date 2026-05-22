<template>
  <div class="dashboard-container bg-background">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="mb-6">
        <Button variant="ghost" class="mb-4" @click="goBack">
          <ArrowLeft class="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-4xl font-bold tracking-tight">Client Status Pages</h1>
            <p class="text-muted-foreground mt-2">Shareable status views for monitored client services</p>
          </div>
        </div>
      </div>

      <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="client in sortedClients"
          :key="client.slug"
          :to="`/clients/${client.slug}`"
          class="block"
        >
          <Card class="h-full transition hover:shadow-lg hover:scale-[1.01] dark:hover:border-gray-700">
            <CardHeader class="pb-2">
              <CardTitle class="flex items-center justify-between gap-3 text-base">
                <span>{{ client.title }}</span>
                <ExternalLink class="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="font-mono text-sm text-muted-foreground break-all">{{ client.domain }}</p>
              <p class="text-xs text-muted-foreground mt-3">{{ client.monitorNames.length }} checks</p>
            </CardContent>
          </Card>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ExternalLink } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { clientPages } from '@/utils/clientPages'

const router = useRouter()

const sortedClients = computed(() => {
  return [...clientPages].sort((a, b) => a.title.localeCompare(b.title))
})

const goBack = () => {
  router.push('/')
}
</script>
