<template>
  <div class="super-overview">
    <div class="topbar">
      <div class="topbar-inner">
        <h1 class="topbar-title">Venue Platform Overview</h1>
        <p class="topbar-subtitle">
          Multi-tenant restaurant &amp; salon operations, revenue &amp;
          compliance
        </p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading platform overview…</p>
      </div>

      <div v-else class="overview-grid">
        <!-- KPI strip -->
        <section class="kpi-strip">
          <article v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <span class="kpi-suffix">{{ kpi.suffix }}</span>
          </article>
        </section>

        <!-- Platform health -->
        <section class="health-widget" v-if="health.status">
          <div class="health-status" :class="'hs-' + health.status">
            <span class="health-dot"></span>
            <b>{{
              health.status === "healthy"
                ? "All systems healthy"
                : health.status === "degraded"
                  ? "System degraded"
                  : "Health check unavailable"
            }}</b>
          </div>
          <div class="health-checks">
            <span
              v-for="(val, key) in health.checks"
              :key="key"
              class="health-check"
              :class="'hc-' + val"
            >
              {{ key }}: {{ val }}
            </span>
          </div>
        </section>

        <!-- Tenant workspace grid -->
        <div class="section-head">
          <h2>Venue Workspaces</h2>
          <a href="#" @click.prevent="goTo('/super-admin/tenants')"
            >View all venues →</a
          >
        </div>

        <section class="tenant-grid">
          <article
            v-for="tenant in featuredTenants"
            :key="tenant.id"
            class="tenant-card"
          >
            <div class="tenant-top">
              <div
                class="tenant-logo"
                :style="{ background: tenant.logoGradient }"
              >
                {{ tenant.initial }}
              </div>
              <div class="tenant-name">
                <b>{{ tenant.name }}</b>
                <span>{{ tenant.slug }} · {{ tenant.location }}</span>
              </div>
              <span class="tenant-status" :class="tenant.statusClass">
                {{ tenant.statusLabel }}
              </span>
            </div>

            <div class="tenant-stats">
              <div>
                <span>Revenue</span>
                <b>{{ formatMoney(tenant.revenue) }}</b>
              </div>
              <div>
                <span>Bookings</span>
                <b>{{ tenant.bookings }}</b>
              </div>
              <div>
                <span>Covers</span>
                <b>{{ tenant.seats }}</b>
              </div>
            </div>

            <div class="health-bar">
              <i :style="{ width: tenant.health + '%' }"></i>
            </div>

            <button class="access-btn" @click="accessTenant(tenant)">
              Open Venue →
            </button>
          </article>
        </section>

        <!-- Lower grid: revenue chart + plan distribution -->
        <section class="lower-grid">
          <div class="panel chart-panel">
            <h3>Booking Revenue &amp; Growth</h3>
            <p class="panel-sub">Last 12 months · platform-wide reservations</p>
            <RevenueTrendChart
              :labels="revenueLabels"
              :mrr-series="revenueMrr"
              :tenant-series="revenueTenants"
              :loading="revenueLoading"
              :error="revenueError"
            />
          </div>

          <div class="panel">
            <h3>Plan Distribution</h3>
            <p class="panel-sub">Across {{ dashboard.total }} venues</p>
            <div v-if="planDistribution.length === 0" class="empty-state">
              No plans configured
            </div>
            <div
              v-for="plan in planDistribution"
              :key="plan.label"
              class="plan-row"
            >
              <span class="sw" :style="{ background: plan.color }"></span>
              <div>
                <b>{{ plan.label }}</b>
                <span>{{ plan.note }}</span>
              </div>
              <span class="plan-num">{{ plan.count }}</span>
            </div>
          </div>
        </section>

        <!-- Support ticket inbox -->
        <div class="section-head">
          <h2>Venue Support Tickets</h2>
          <a href="#" @click.prevent="goTo('/super-admin/support-tickets')"
            >Open all →</a
          >
        </div>

        <section class="panel activity-feed">
          <div v-if="ticketsLoading" class="loading-state-inline">
            <div class="spinner-sm"></div>
          </div>
          <div v-else-if="tickets.length === 0" class="empty-state">
            No open support tickets
          </div>
          <div
            v-for="(ticket, idx) in tickets"
            :key="ticket.id || idx"
            class="feed-item"
          >
            <div
              class="feed-icon"
              :style="{
                background:
                  ticket.priority === 'critical'
                    ? 'var(--rose-100)'
                    : ticket.priority === 'high'
                      ? 'var(--accent-100)'
                      : 'var(--sky-100)',
              }"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                :stroke="
                  ticket.priority === 'critical'
                    ? 'var(--rose-600)'
                    : ticket.priority === 'high'
                      ? 'var(--accent-600)'
                      : 'var(--sky-600)'
                "
                stroke-width="2"
              >
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                />
              </svg>
            </div>
            <div class="feed-text">
              <b>{{ ticket.subject }}</b>
              <p>{{ ticket.message }}</p>
            </div>
            <span
              class="ticket-badge"
              :class="'tb-' + (ticket.status || 'open')"
              >{{ ticket.status }}</span
            >
          </div>
        </section>

        <!-- Failed payment alerts -->
        <div class="section-head">
          <h2>Payment &amp; Reservation Failures</h2>
          <a href="#" @click.prevent="goTo('/super-admin/at-risk-tenants')"
            >View all →</a
          >
        </div>

        <section class="panel activity-feed">
          <div v-if="paymentAlertsLoading" class="loading-state-inline">
            <div class="spinner-sm"></div>
          </div>
          <div v-else-if="paymentAlerts.length === 0" class="empty-state">
            No failed payment alerts
          </div>
          <div
            v-for="(alert, idx) in paymentAlerts"
            :key="alert.id || idx"
            class="feed-item"
          >
            <div class="feed-icon" style="background: var(--rose-100)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--rose-600)"
                stroke-width="2"
              >
                <path
                  d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                />
              </svg>
            </div>
            <div class="feed-text">
              <b>Payment failed · {{ formatMoney(alert.amount) }}</b>
              <p>{{ alert.reason || "Unknown failure" }}</p>
            </div>
            <span
              class="ticket-badge"
              :class="'tb-' + (alert.status || 'open')"
              >{{ alert.status }}</span
            >
          </div>
        </section>

        <!-- Backup & Deployment -->
        <section class="lower-grid">
          <div class="panel">
            <h3>Data Backup Status</h3>
            <p class="panel-sub">Latest backup</p>
            <div v-if="backupLoading" class="loading-state-inline">
              <div class="spinner-sm"></div>
            </div>
            <div v-else-if="backupStatus" class="backup-status">
              <div class="backup-row">
                <span>Last backup</span>
                <b>{{
                  formatTimeAgo(
                    new Date(
                      backupStatus.latestBackup?.createdAt ||
                        backupStatus.lastBackupAt
                    )
                  )
                }}</b>
              </div>
              <div class="backup-row">
                <span>Status</span>
                <b
                  :class="
                    'status-' + (backupStatus.latestBackup?.status || 'unknown')
                  "
                  >{{ backupStatus.latestBackup?.status || "none" }}</b
                >
              </div>
            </div>
            <div v-else class="empty-state">No backups found</div>
          </div>

          <div class="panel">
            <h3>Platform Deployment</h3>
            <p class="panel-sub">{{ deploymentStatus.environment }}</p>
            <div v-if="deploymentLoading" class="loading-state-inline">
              <div class="spinner-sm"></div>
            </div>
            <div v-else class="deployment-status">
              <div class="backup-row">
                <span>Version</span>
                <b>{{ deploymentStatus.version }}</b>
              </div>
              <div class="backup-row">
                <span>Uptime</span>
                <b>{{ formatUptime(deploymentStatus.uptime) }}</b>
              </div>
              <div class="backup-row">
                <span>Health</span>
                <b :class="'status-' + deploymentHealth.status">{{
                  deploymentHealth.status
                }}</b>
              </div>
            </div>
          </div>
        </section>

        <!-- Brute-force aggregation -->
        <div class="section-head">
          <h2>Security: Suspicious Activity</h2>
          <a href="#" @click.prevent="goTo('/super-admin/at-risk-tenants')"
            >View all →</a
          >
        </div>

        <section class="panel activity-feed">
          <div v-if="bruteForceLoading" class="loading-state-inline">
            <div class="spinner-sm"></div>
          </div>
          <div v-else-if="bruteForceData.length === 0" class="empty-state">
            No suspicious booking or login patterns detected
          </div>
          <div
            v-for="(item, idx) in bruteForceData"
            :key="idx"
            class="feed-item"
          >
            <div class="feed-icon" style="background: var(--accent-100)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-600)"
                stroke-width="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div class="feed-text">
              <b>{{ item.email || item.ipAddress }}</b>
              <p>
                {{ item.attemptCount }} attempts · last:
                {{ formatTimeAgo(new Date(item.lastAttempt)) }}
              </p>
            </div>
            <span class="ticket-badge tb-high">{{ item.attemptCount }}</span>
          </div>
        </section>

        <!-- Compliance scorecard -->
        <div class="section-head">
          <h2>Compliance &amp; Legal</h2>
        </div>

        <section class="panel activity-feed" v-if="complianceScorecard">
          <div class="compliance-grid">
            <div class="compliance-item">
              <span>Total Venues</span>
              <b>{{ complianceScorecard.totalTenants }}</b>
            </div>
            <div class="compliance-item">
              <span>Accepted</span>
              <b>{{ complianceScorecard.acceptedCount }}</b>
            </div>
            <div class="compliance-item">
              <span>Pending</span>
              <b>{{ complianceScorecard.pendingCount }}</b>
            </div>
            <div class="compliance-item">
              <span>Acceptance Rate</span>
              <b>{{ complianceScorecard.acceptanceRate }}%</b>
            </div>
          </div>
        </section>

        <!-- Support chat queue -->
        <div class="section-head">
          <h2>Venue Support Chat</h2>
        </div>

        <section class="panel activity-feed">
          <div v-if="supportConversations.length === 0" class="empty-state">
            No open support conversations
          </div>
          <div
            v-for="(conv, idx) in supportConversations"
            :key="conv.id || idx"
            class="feed-item"
          >
            <div
              class="feed-icon"
              :style="{
                background:
                  conv.priority === 'critical'
                    ? 'var(--rose-100)'
                    : conv.priority === 'high'
                      ? 'var(--accent-100)'
                      : 'var(--sky-100)',
              }"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                :stroke="
                  conv.priority === 'critical'
                    ? 'var(--rose-600)'
                    : conv.priority === 'high'
                      ? 'var(--accent-600)'
                      : 'var(--sky-600)'
                "
                stroke-width="2"
              >
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                />
              </svg>
            </div>
            <div class="feed-text">
              <b>{{ conv.subject || "Support request" }}</b>
              <p>Status: {{ conv.status }} · Priority: {{ conv.priority }}</p>
            </div>
            <span
              class="ticket-badge"
              :class="'tb-' + (conv.status || 'open')"
              >{{ conv.status }}</span
            >
          </div>
        </section>

        <!-- Recent activity feed -->
        <div class="section-head">
          <h2>Recent Venue Activity</h2>
          <a href="#" @click.prevent="goTo('/super-admin/audit')"
            >Open audit log →</a
          >
        </div>

        <section class="panel activity-feed">
          <div v-for="(item, idx) in activity" :key="idx" class="feed-item">
            <div class="feed-icon" :style="{ background: item.iconBg }">
              <Icon
                :icon="item.icon"
                width="16"
                height="16"
                :style="{ color: item.iconColor }"
              />
            </div>
            <div class="feed-text">
              <b>{{ item.title }}</b>
              <p>{{ item.detail }}</p>
            </div>
            <div class="feed-time">{{ item.time }}</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import planAPI from "@/services/planAPI";
import adminAPI from "@/services/adminAPI";
import API from "@/services/API";
import { useAuthStore } from "@/stores/auth";
import formatMoney from "@/utils/formatMoney";
import logger from "@/utils/logger";
import revenueAPI from "@/services/revenueAPI";
import RevenueTrendChart from "@/components/admin/RevenueTrendChart.vue";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const dashboard = ref({
  total: 0,
  active: 0,
  inactive: 0,
  pastDue: 0,
  suspended: 0,
  cancelled: 0,
  trialing: 0,
  mrr: 0,
});
const tenants = ref([]);
const plans = ref([]);
const lastUpdated = ref(new Date());
const health = ref({
  status: "loading",
  checks: {},
  memory: {},
});
const healthLoading = ref(false);

const STATUS_MAP = {
  active: { label: "Active", cls: "st-active" },
  trialing: { label: "Trial", cls: "st-trial" },
  past_due: { label: "Past Due", cls: "st-pastdue" },
  suspended: { label: "Suspended", cls: "st-suspended" },
  cancelled: { label: "Cancelled", cls: "st-cancelled" },
};

const LOGO_GRADIENTS = [
  "linear-gradient(135deg, var(--accent-500), var(--accent-600))",
  "linear-gradient(135deg, var(--earth-500), var(--earth-600))",
  "linear-gradient(135deg, var(--brand-400), var(--brand-600))",
  "linear-gradient(135deg, var(--sky-500), var(--sky-600))",
  "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
  "linear-gradient(135deg, var(--accent-400), var(--accent-600))",
];

const lastUpdatedLabel = computed(() => {
  const diff = Math.max(
    0,
    Math.round((Date.now() - lastUpdated.value) / 60000)
  );
  return diff === 0 ? "just now" : `${diff} min ago`;
});

const featuredTenants = computed(() =>
  tenants.value.slice(0, 6).map((t, i) => {
    const s = STATUS_MAP[t.status] || STATUS_MAP.active;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      location: t.location || t.domain || "—",
      statusLabel: s.label,
      statusClass: s.cls,
      revenue: Number(t.mrr || t.monthlyRevenue || 0),
      seats: Number(t.seats || t.userCount || 0),
      bookings: Number(t.reservationsToday || 0),
      health: Number(t.health || 70),
      initial: (t.name || "T").charAt(0).toUpperCase(),
      logoGradient: LOGO_GRADIENTS[i % LOGO_GRADIENTS.length],
    };
  })
);

const inactiveCount = computed(
  () =>
    dashboard.value.inactive ||
    dashboard.value.suspended +
      dashboard.value.cancelled +
      dashboard.value.trialing
);

const kpis = computed(() => [
  {
    label: "Total Venues",
    value: dashboard.value.total,
    suffix: " tenants",
  },
  {
    label: "Active Venues",
    value: dashboard.value.active,
    suffix: " online",
  },
  {
    label: "Platform Revenue",
    value: formatMoney(dashboard.value.mrr),
    suffix: " MRR",
  },
  {
    label: "At-Risk Venues",
    value: dashboard.value.pastDue,
    suffix: " past due",
  },
]);

const planDistribution = computed(() => {
  const list = plans.value || [];
  if (!list.length) return [];
  return list.map((p) => ({
    label: p.name,
    note: p.description || `${p.currency} ${p.price} / mo`,
    count: Number(p.tenantCount || 0),
    color: LOGO_GRADIENTS[list.indexOf(p) % LOGO_GRADIENTS.length].match(
      /var\(([^)]+)\)/
    )?.[1]
      ? `var(${
          LOGO_GRADIENTS[list.indexOf(p) % LOGO_GRADIENTS.length].match(
            /var\(([^)]+)\)/
          )[1]
        })`
      : "var(--brand-500)",
  }));
});

// Revenue trend (wired to revenueAPI.getMrrTrends)
const revenueLabels = ref([]);
const revenueMrr = ref([]);
const revenueTenants = ref([]);
const revenueLoading = ref(false);
const revenueError = ref("");

const loadRevenueTrends = async () => {
  revenueLoading.value = true;
  revenueError.value = "";
  try {
    const res = await revenueAPI.getMrrTrends(12);
    const data = res.data?.collection || res.data || [];
    const series = Array.isArray(data) ? data : [data];
    revenueLabels.value = series.map(
      (d) => d.month || d.period || d.label || ""
    );
    revenueMrr.value = series.map((d) => Number(d.mrr ?? d.revenue ?? 0));
    revenueTenants.value = series.map((d) =>
      Number(d.activeTenants ?? d.tenants ?? d.count ?? 0)
    );
  } catch (e) {
    revenueError.value = "Unable to load revenue trends";
    logger.error("Failed to load MRR trends", { error: e?.message });
  } finally {
    revenueLoading.value = false;
  }
};

const loadHealth = async () => {
  healthLoading.value = true;
  try {
    const res = await API.get("/admin/deployment/health");
    health.value = res.data || { status: "unknown" };
  } catch (e) {
    health.value = { status: "unreachable" };
  } finally {
    healthLoading.value = false;
  }
};

const activity = ref([]);
const activityLoading = ref(false);
const tickets = ref([]);
const ticketsLoading = ref(false);
const paymentAlerts = ref([]);
const paymentAlertsLoading = ref(false);
const backupStatus = ref(null);
const backupLoading = ref(false);
const deploymentStatus = ref({});
const deploymentLoading = ref(false);
const deploymentHealth = ref({ status: "unknown" });
const bruteForceData = ref([]);
const bruteForceLoading = ref(false);
const complianceScorecard = ref(null);
const supportConversations = ref([]);

const ACTION_ICON_MAP = {
  tenant: {
    bg: "var(--earth-100)",
    color: "var(--earth-600)",
    icon: "mdi:check",
  },
  payment: {
    bg: "var(--sky-100)",
    color: "var(--sky-600)",
    icon: "mdi:credit-card",
  },
  audit: {
    bg: "var(--accent-100)",
    color: "var(--accent-600)",
    icon: "mdi:shield-check",
  },
  user: {
    bg: "var(--brand-100)",
    color: "var(--brand-700)",
    icon: "mdi:account",
  },
  default: {
    bg: "var(--neutral-100)",
    color: "var(--neutral-600)",
    icon: "mdi:circle-outline",
  },
};

const loadActivity = async () => {
  activityLoading.value = true;
  try {
    const res = await adminAPI.getRecentActivity(20);
    const collection = res.data?.collection || [];
    activity.value = collection.map((item) => {
      const category =
        item.entityType === "tenant"
          ? "tenant"
          : item.action?.startsWith("payment")
            ? "payment"
            : item.action?.startsWith("super_admin")
              ? "audit"
              : item.entityType === "user"
                ? "user"
                : "default";
      const style = ACTION_ICON_MAP[category] || ACTION_ICON_MAP.default;
      const timeAgo = formatTimeAgo(new Date(item.createdAt));
      let title = item.title || item.action;
      let detail = item.detail || "";
      if (item.tenantName && !detail.includes(item.tenantName)) {
        detail = detail ? `${item.tenantName} · ${detail}` : item.tenantName;
      }
      return {
        title,
        detail,
        time: timeAgo,
        iconBg: style.bg,
        icon: style.icon,
        iconColor: style.color,
      };
    });
  } catch (e) {
    logger.error("Failed to load recent activity", { error: e?.message });
    activity.value = [];
  } finally {
    activityLoading.value = false;
  }
};

const loadTickets = async () => {
  ticketsLoading.value = true;
  try {
    const res = await adminAPI.listSupportTickets();
    const collection = res.data?.collection || [];
    tickets.value = collection.slice(0, 5);
  } catch (e) {
    logger.error("Failed to load support tickets", { error: e?.message });
    tickets.value = [];
  } finally {
    ticketsLoading.value = false;
  }
};

const loadPaymentAlerts = async () => {
  paymentAlertsLoading.value = true;
  try {
    const res = await adminAPI.listFailedPaymentAlerts({ limit: 5 });
    paymentAlerts.value = (res.data?.collection || []).slice(0, 5);
  } catch (e) {
    logger.error("Failed to load payment alerts", { error: e?.message });
    paymentAlerts.value = [];
  } finally {
    paymentAlertsLoading.value = false;
  }
};

const loadBackupStatus = async () => {
  backupLoading.value = true;
  try {
    const res = await adminAPI.getBackupStatus();
    backupStatus.value = res.data || null;
  } catch (e) {
    backupStatus.value = null;
  } finally {
    backupLoading.value = false;
  }
};

const loadDeploymentStatus = async () => {
  deploymentLoading.value = true;
  try {
    const [statusRes, healthRes] = await Promise.all([
      adminAPI.getDeploymentStatus(),
      adminAPI.getDeploymentHealth(),
    ]);
    deploymentStatus.value = statusRes.data?.status || {};
    deploymentHealth.value = healthRes.data || { status: "unknown" };
  } catch (e) {
    deploymentStatus.value = {};
    deploymentHealth.value = { status: "unreachable" };
  } finally {
    deploymentLoading.value = false;
  }
};

const loadBruteForceAggregation = async () => {
  bruteForceLoading.value = true;
  try {
    const res = await adminAPI.getBruteForceAggregation();
    bruteForceData.value = res.data?.collection || [];
  } catch (e) {
    bruteForceData.value = [];
  } finally {
    bruteForceLoading.value = false;
  }
};

const loadComplianceScorecard = async () => {
  try {
    const res = await adminAPI.getComplianceScorecard();
    complianceScorecard.value = res.data?.scorecard || null;
  } catch (e) {
    complianceScorecard.value = null;
  }
};

const loadSupportConversations = async () => {
  try {
    const res = await adminAPI.listSupportConversations();
    supportConversations.value = (res.data?.collection || []).slice(0, 5);
  } catch (e) {
    supportConversations.value = [];
  }
};

const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const loadDashboard = async () => {
  const res = await tenantAdminAPI.getDashboard();
  dashboard.value = { ...dashboard.value, ...res.data };
};

const loadTenants = async () => {
  const res = await tenantAdminAPI.getAll();
  const collection = res.data.collection || res.data || [];
  tenants.value = Array.isArray(collection) ? collection : [];
};

const loadPlans = async () => {
  try {
    const res = await planAPI.listPlans();
    plans.value = res.data.collection || res.data || [];
  } catch {
    plans.value = [];
  }
};

const accessTenant = (tenant) => {
  authStore.setTenant(tenant);
  router.push("/reservations");
};

const goTo = (path) => router.push(path);

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadDashboard(),
      loadTenants(),
      loadPlans(),
      loadRevenueTrends(),
      loadActivity(),
      loadTickets(),
      loadHealth(),
      loadPaymentAlerts(),
      loadBackupStatus(),
      loadDeploymentStatus(),
      loadBruteForceAggregation(),
      loadComplianceScorecard(),
      loadSupportConversations(),
    ]);
    lastUpdated.value = new Date();
  } catch (e) {
    logger.error("Failed to load super admin overview", { error: e?.message });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-5) var(--page-margin-x);
}
.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.topbar-title {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}
.topbar-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  margin: 4px 0 0;
}

.content-wrapper {
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.overview-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* KPI strip */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.kpi-card {
  position: relative;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.kpi-card::after {
  content: "";
  position: absolute;
  right: -30px;
  top: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-soft), transparent 70%);
}
.kpi-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
  font-weight: 600;
}
.kpi-value {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--ink);
  margin: var(--space-2) 0 var(--space-1);
  line-height: 1;
  letter-spacing: var(--tracking-tight);
}
.kpi-suffix {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  color: var(--ink-muted);
}

/* Section heading */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-head h2 {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.section-head a {
  color: var(--accent-600);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
}
.section-head a:hover {
  text-decoration: underline;
}

/* Tenant grid */
.tenant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
.tenant-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-200) var(--ease-out),
    box-shadow var(--duration-200) var(--ease-out),
    border-color var(--duration-200) var(--ease-out);
}
.tenant-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-200);
}
.tenant-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.tenant-logo {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--white);
  font-size: var(--text-lg);
  flex-shrink: 0;
}
.tenant-name {
  line-height: 1.2;
  min-width: 0;
}
.tenant-name b {
  display: block;
  font-size: var(--text-sm);
  color: var(--ink);
}
.tenant-name span {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.tenant-status {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.st-active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.st-trial {
  background: var(--sky-100);
  color: var(--sky-600);
}
.st-pastdue {
  background: var(--accent-100);
  color: var(--accent-600);
}
.st-suspended {
  background: var(--rose-100);
  color: var(--rose-600);
}
.st-cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.tenant-stats {
  display: flex;
  gap: var(--space-5);
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-3);
}
.tenant-stats div span {
  display: block;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
  font-weight: 600;
}
.tenant-stats div b {
  font-size: var(--text-base);
  color: var(--ink-secondary);
  font-family: var(--font-serif);
}
.health-bar {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--neutral-200);
  overflow: hidden;
  margin-top: var(--space-3);
}
.health-bar i {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--earth-400), var(--accent-400));
}
.access-btn {
  margin-top: var(--space-4);
  width: 100%;
  border: none;
  cursor: pointer;
  background: var(--brand-800);
  color: var(--white);
  font-weight: 600;
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  transition: background var(--duration-150) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
}
.access-btn:hover {
  background: var(--brand-900);
}

/* Lower grid */
.lower-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-4);
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.panel h3 {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.panel-sub {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: var(--space-1) 0 var(--space-4);
}
.plan-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.plan-row:last-child {
  border-bottom: none;
}
.plan-row .sw {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.plan-row b {
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.plan-row span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.plan-num {
  margin-left: auto;
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--ink);
}

/* Activity feed */
.activity-feed {
  display: flex;
  flex-direction: column;
}
.feed-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.feed-item:last-child {
  border-bottom: none;
}
.feed-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  display: grid;
  place-items: center;
}
.feed-text {
  min-width: 0;
}
.feed-text b {
  color: var(--ink);
  font-size: var(--text-sm);
}
.feed-text p {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-top: 2px;
}
.feed-time {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: nowrap;
}

.loading-state-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
.empty-state {
  padding: var(--space-4);
  text-align: center;
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.ticket-badge {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  white-space: nowrap;
  text-transform: capitalize;
}
.tb-open {
  background: var(--sky-100);
  color: var(--sky-600);
}
.tb-in_progress {
  background: var(--accent-100);
  color: var(--accent-600);
}
.tb-resolved {
  background: var(--earth-100);
  color: var(--earth-600);
}
.tb-closed {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.health-widget {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-sm);
}
.health-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.health-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  display: inline-block;
}
.hs-healthy .health-dot {
  background: var(--earth-500);
}
.hs-degraded .health-dot {
  background: var(--accent-500);
}
.hs-unreachable .health-dot {
  background: var(--rose-500);
}
.health-checks {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.health-check {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: capitalize;
}
.hc-healthy {
  color: var(--earth-600);
}
.hc-unavailable {
  color: var(--accent-600);
}
.hc-warning {
  color: var(--accent-600);
}
.hc-unhealthy {
  color: var(--rose-600);
}

.backup-status,
.deployment-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.backup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.backup-row b {
  color: var(--ink);
  font-family: var(--font-serif);
}
.status-completed {
  color: var(--earth-600);
}
.status-failed {
  color: var(--rose-600);
}
.status-running {
  color: var(--accent-600);
}
.status-pending {
  color: var(--sky-600);
}
.status-healthy {
  color: var(--earth-600);
}
.status-degraded {
  color: var(--accent-600);
}
.status-unreachable {
  color: var(--rose-600);
}

.compliance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.compliance-item {
  text-align: center;
}
.compliance-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: 600;
}
.compliance-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-top: var(--space-1);
}

@media (max-width: 1100px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .tenant-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lower-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .tenant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
