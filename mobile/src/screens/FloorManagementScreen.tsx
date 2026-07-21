import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Table, getTables, freeTable, blockTable, unblockTable } from '../services/tables';
import { onTableStatusChanged, onTableFreed, offAll } from '../services/socket';
import { brandColors, tableStatusColors } from '../theme/colors';

export default function FloorManagementScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const res = await getTables();
      if (res.tables) {
        setTables(res.tables);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTables();

    onTableStatusChanged((data) => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === data.tableId ? { ...t, status: data.status } : t
        )
      );
    });

    onTableFreed((data) => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === data.tableId ? { ...t, status: 'free', reservationId: null } : t
        )
      );
    });

    return () => {
      offAll('table-status-changed');
      offAll('table-freed');
    };
  }, [loadTables]);

  const handleFree = async (tableId: number) => {
    try {
      await freeTable(tableId);
    } catch {
      Alert.alert('Error', 'Failed to free table');
    }
  };

  const handleBlockToggle = async (table: Table) => {
    try {
      if (table.isBlocked) {
        await unblockTable(table.id);
      } else {
        await blockTable(table.id);
      }
    } catch {
      Alert.alert('Error', 'Failed to update table status');
    }
  };

  const renderTable = ({ item }: { item: Table }) => {
    const colors = tableStatusColors[item.status as keyof typeof tableStatusColors] ||
      tableStatusColors.free;
    return (
      <TouchableOpacity
        style={[styles.tableCard, { borderLeftColor: colors.text }]}
        onPress={() => handleBlockToggle(item)}
        onLongPress={() => handleFree(item.id)}
      >
        <View style={styles.tableHeader}>
          <Text style={styles.tableName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.tableMeta}>Capacity: {item.capacity}</Text>
        {item.users && item.users.length > 0 && (
          <Text style={styles.tableMeta}>
            Staff: {item.users.map((u) => u.name).join(', ')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading floor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Floor Management</Text>
        <Text style={styles.hint}>Tap to block/unblock · Long-press to free</Text>
      </View>
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTable}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTables} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No tables configured.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: brandColors.textMuted, fontSize: 16 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: brandColors.border },
  screenTitle: { fontSize: 22, fontWeight: '700', color: brandColors.textPrimary },
  hint: { fontSize: 12, color: brandColors.textMuted, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  tableCard: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableName: { fontSize: 18, fontWeight: '600', color: brandColors.textPrimary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  tableMeta: { fontSize: 13, color: brandColors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: brandColors.textMuted, marginTop: 40 },
});
