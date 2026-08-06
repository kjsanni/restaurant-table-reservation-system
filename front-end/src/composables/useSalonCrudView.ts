import { ref, onMounted } from "vue";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";

export function useSalonCrudView<T>(config: {
  api: Record<string, any>;
  entityName: string;
  defaultForm: Record<string, any>;
  listMethod?: string;
  createMethod?: string;
  updateMethod?: string;
  deleteMethod?: string;
  editMapper?: (item: T) => Record<string, any>;
  extra?: Record<string, any>;
}) {
  const { t } = useI18n();

  const list = ref<T[]>([]);
  const loading = ref(true);
  const showForm = ref(false);
  const editingId = ref<number | null>(null);
  const form = ref<Record<string, any>>({ ...config.defaultForm });
  const extra = ref<Record<string, any>>({ ...(config.extra || {}) });

  const load = async () => {
    loading.value = true;
    try {
      const res = await api[config.listMethod || "list"]({ limit: 100 });
      list.value = res.data.data || [];
    } catch (err) {
      logger.error(`Failed to load ${config.entityName}s`, { error: err });
    } finally {
      loading.value = false;
    }
  };

  const resetForm = () => {
    form.value = { ...config.defaultForm };
    editingId.value = null;
  };

  const submitForm = async () => {
    try {
      const payload = { ...form.value };
      if (editingId.value) {
        const res = await api[config.updateMethod || "update"](
          editingId.value,
          payload
        );
        const idx = list.value.findIndex(
          (item: any) => item.id === editingId.value
        );
        if (idx !== -1) list.value[idx] = res.data.data;
      } else {
        const res = await api[config.createMethod || "create"](payload);
        list.value.push(res.data.data);
      }
      showForm.value = false;
      resetForm();
    } catch (err) {
      logger.error(`Failed to save ${config.entityName}`, { error: err });
    }
  };

  const edit = (item: T) => {
    editingId.value = (item as any).id;
    form.value = config.editMapper
      ? config.editMapper(item)
      : { ...(item as any) };
    showForm.value = true;
  };

  const deleteItem = async (id: number) => {
    if (!confirm(t("salon.confirmDelete", `Delete this ${config.entityName}?`)))
      return;
    try {
      await api[config.deleteMethod || "delete"](id);
      list.value = list.value.filter((item: any) => item.id !== id);
    } catch (err) {
      logger.error(`Failed to delete ${config.entityName}`, { error: err });
    }
  };

  return {
    list,
    loading,
    showForm,
    editingId,
    form,
    extra,
    load,
    resetForm,
    submitForm,
    edit,
    deleteItem,
  };
}
