import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reservation, getReservations, updateReservationStatus } from '../services/reservations';
import { brandColors, reservationStatusColors } from '../theme/colors';

const statusActions: Record<string, string[]> = {
  pending: ['seated', 'completed', 'cancelled'],
  seated: ['completed', 'cancelled'],
};

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await getReservations({ date: today });
      const data = res.collection || res.items || [];
      setReservations(data);
    } catch {
      Alert.alert('Error', 'Failed to load reservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateReservationStatus(id, status);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      Alert.alert('Error', 'Failed to update reservation');
    }
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const color = reservationStatusColors[item.status] || brandColors.neutral500;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
        </View>
        <Text style={styles.detail}>
          {item.time} · {item.people} {item.people === 1 ? 'guest' : 'guests'}
        </Text>
        {item.phone && <Text style={styles.detail}>Phone: {item.phone}</Text>}
        {item.notes && <Text style={styles.notes}>Notes: {item.notes}</Text>}
        <Text style={styles.statusLabel}>Status: {item.status}</Text>
        {statusActions[item.status]?.map((action) => (
          <TouchableOpacity
            key={action}
            style={styles.actionBtn}
            onPress={() => handleStatusChange(item.id, action)}
          >
            <Text style={styles.actionBtnText}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading reservations…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Today's Reservations</Text>
      </View>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No reservations today.</Text>}
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
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerName: { fontSize: 18, fontWeight: '600', color: brandColors.textPrimary },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  detail: { fontSize: 14, color: brandColors.textMuted, marginTop: 2 },
  notes: { fontSize: 13, color: brandColors.textMuted, marginTop: 2, fontStyle: 'italic' },
  statusLabel: { fontSize: 13, color: brandColors.neutral700, marginTop: 4, fontWeight: '500' },
  actionBtn: {
    marginTop: 8,
    backgroundColor: brandColors.brand600,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', color: brandColors.textMuted, marginTop: 40 },
});
