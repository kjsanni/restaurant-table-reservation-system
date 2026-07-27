import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useTenantBranding } from "@/composables/useTenantBranding";
import tenantPublicAPI from "@/services/tenantPublicAPI";

export function useTenantResolver() {
  const router = useRouter();
  const authStore = useAuthStore();
  const { apply: applyBranding } = useTenantBranding();

  const resolving = ref(false);
  const resolvedTenant = computed(() => authStore.currentTenant);

  const resolveFromPath = async (slug: string) => {
    if (!slug) return null;
    resolving.value = true;
    try {
      const response = await tenantPublicAPI.getBySlug(slug);
      const found = response.data.item;
      if (found) {
        authStore.setTenant({
          id: found.id,
          name: found.name,
          slug: found.slug,
          businessVertical: found.businessVertical,
        });
        if (found.settings?.branding) {
          applyBranding();
        }
        return found;
      }
      return null;
    } catch (err) {
      return null;
    } finally {
      resolving.value = false;
    }
  };

  const resolveFromHost = async (host: string) => {
    const slug = host.split(".")[0];
    if (!slug || slug === "www" || slug === "localhost" || slug === "127") return null;
    return resolveFromPath(slug);
  };

  const redirectToPortalHome = () => {
    router.replace("/portal");
  };

  return {
    resolving,
    resolvedTenant,
    resolveFromPath,
    resolveFromHost,
    redirectToPortalHome,
  };
}
