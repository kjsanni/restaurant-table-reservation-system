<template>
  <div class="super-overview">
    <PageHeader
      title="Platform Overview"
      :subtitle="`Cross-tenant health, revenue, and operations — ${lastUpdatedLabel}`"
    />

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
            <span class="kpi-delta" :class="kpi.delta >= 0 ? 'up' : 'down'">
              {{ kpi.delta >= 0 ? "▲" : "▼" }} {{ Math.abs(kpi.delta)
              }}{{ kpi.suffix }}
            </span>
            <svg
              class="kpi-spark"
              viewBox="0 0 74 30"
              preserveAspectRatio="none"
            >
              <polyline
                :points="kpi.spark"
                :stroke="
                  kpi.delta >= 0 ? 'var(--earth-500)' : 'var(--rose-500)'
                "
                stroke-width="2"
                fill="none"
              />
            </svg>
          </article>
        </section>

        <!-- Tenant workspace grid -->
        <div class="section-head">
          <h2>Tenant Workspaces</h2>
          <a href="#" @click.prevent="goTo('/admin/tenants')"
            >View all tenants →</a
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
                <span>MRR</span>
                <b>{{ formatMoney(tenant.mrr) }}</b>
              </div>
              <div>
                <span>Seats</span>
                <b>{{ tenant.seats }}</b>
              </div>
              <div>
                <span>Res/today</span>
                <b>{{ tenant.reservationsToday }}</b>
              </div>
            </div>

            <div class="health-bar">
              <i :style="{ width: tenant.health + '%' }"></i>
            </div>

            <button class="access-btn" @click="accessTenant(tenant)">
              Access Tenant →
            </button>
          </article>
        </section>

        <!-- Lower grid: revenue chart + plan distribution -->
        <section class="lower-grid">
          <div class="panel chart-panel">
            <h3>Revenue &amp; Tenant Growth</h3>
            <p class="panel-sub">Last 12 months · platform aggregate</p>
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
            <p class="panel-sub">Across {{ dashboard.total }} tenants</p>
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

        <!-- Recent activity feed -->
        <div class="section-head">
          <h2>Recent Platform Activity</h2>
          <a href="#" @click.prevent="goTo('/admin/audit')">Open audit log →</a>
        </div>

        <section class="panel activity-feed">
          <div v-for="(item, idx) in activity" :key="idx" class="feed-item">
            <div class="feed-icon" :style="{ background: item.iconBg }">
              <span v-html="item.icon"></span>
            </div>
            <div class="feed-text">
              <b v-html="item.title"></b>
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
import PageHeader from "@/components/PageHeader.vue";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import planAPI from "@/services/planAPI";
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
      mrr: Number(t.mrr || t.monthlyRevenue || 0),
      seats: Number(t.seats || t.userCount || 0),
      reservationsToday: Number(t.reservationsToday || 0),
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
    label: "Total Tenants",
    value: dashboard.value.total,
    delta: 6,
    suffix: " this wk",
    spark: "0,22 12,18 24,20 36,12 48,14 60,7 74,5",
  },
  {
    label: "Active Tenants",
    value: dashboard.value.active,
    delta: Math.round(
      (dashboard.value.active / Math.max(1, dashboard.value.total)) * 100
    ),
    suffix: "% active",
    spark: "0,14 12,16 24,11 36,13 48,8 60,10 74,6",
  },
  {
    label: "Platform MRR",
    value: formatMoney(dashboard.value.mrr),
    delta: 12.4,
    suffix: "%",
    spark: "0,24 12,20 24,21 36,14 48,15 60,9 74,4",
  },
  {
    label: "At-Risk / Past Due",
    value: dashboard.value.pastDue,
    delta: -2,
    suffix: " churned",
    spark: "0,8 12,10 24,7 36,12 48,11 60,16 74,18",
  },
]);

const planDistribution = computed(() => {
  const list = plans.value || [];
  return list.length
    ? list.map((p) => ({
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
      }))
    : [
        {
          label: "Enterprise",
          note: "Dedicated support, SSO",
          count: 18,
          color: "var(--earth-600)",
        },
        {
          label: "Growth",
          note: "Multi-location",
          count: 54,
          color: "var(--accent-500)",
        },
        {
          label: "Starter",
          note: "Single location",
          count: 41,
          color: "var(--brand-500)",
        },
        {
          label: "Trial / Free",
          note: "14-day window",
          count: 15,
          color: "var(--neutral-500)",
        },
      ];
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

const activity = ref([
  {
    title: "<b>Lumiere Dining</b> upgraded to Enterprise plan",
    detail: "Triggered by in-app checkout",
    time: "12 min ago",
    iconBg: "var(--earth-100)",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--earth-600)" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  },
  {
    title: "<b>The Salt Cellar</b> payment failed — invoice past due",
    detail: "Retry attempts scheduled via billing worker",
    time: "47 min ago",
    iconBg: "var(--rose-100)",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose-600)" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
  },
  {
    title: "<b>Maples Bistro</b> started 14-day trial",
    detail: "Provisioned tenant · 8 seats",
    time: "2 hr ago",
    iconBg: "var(--sky-100)",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sky-600)" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  },
  {
    title: "Feature flag <code>server_overlay</code> enabled platform-wide",
    detail: "Rolled out to active tenants",
    time: "5 hr ago",
    iconBg: "var(--accent-100)",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-600)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
  },
]);

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
.kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}
.kpi-delta.up {
  background: var(--earth-100);
  color: var(--earth-600);
}
.kpi-delta.down {
  background: var(--rose-100);
  color: var(--rose-600);
}
.kpi-spark {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-3);
  width: 74px;
  height: 30px;
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
  transition: transform var(--duration-200) var(--ease-out),
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
