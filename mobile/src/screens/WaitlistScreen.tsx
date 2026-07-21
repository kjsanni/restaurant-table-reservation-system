import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaitlistEntry, getWaitlist, updateWaitlistStatus } from '../services/waitlist';
import { onWaitlistOffer, offAll } from '../services/socket';
import { brandColors } from '../theme/colors';

export default function WaitlistScreen() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getWaitlist();
      setEntries(res.collection || res.items || []);
    } catch {
      Alert.alert('Error', 'Failed to load waitlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    onWaitlistOffer((data) => {
      Alert.alert(
        'Waitlist Offer',
        data.message || 'A table is available for a waitlisted guest.',
        [{ text: 'OK', onPress: () => load() }]
      );
    });

    return () => offAll('waitlist-offer');
  }, [load]);

  const handleSeat = async (id: number) => {
    try {
      await updateWaitlistStatus(id, 'seated');
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      Alert.alert('Error', 'Failed to update waitlist');
    }
  };

  const renderItem = ({ item }: { item: WaitlistEntry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.waitTime}>{item.estimatedWaitMins || '—'} min</Text>
      </View>
      <Text style={styles.detail}>{item.partySize} guests · {item.status}</Text>
      {item.phone && <Text style={styles.detail}>Phone: {item.phone}</Text>}
      <TouchableOpacity style={styles.seatBtn} onPress={() => handleSeat(item.id)}>
        <Text style={styles.seatBtnText}>Mark as Seated</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading waitlist…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Waitlist</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No one on the waitlist.</Text>}
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
  waitTime: { fontSize: 14, color: brandColors.accent600, fontWeight: '500' },
  detail: { fontSize: 14, color: brandColors.textMuted, marginTop: 2 },
  seatBtn: {
    marginTop: 8,
    backgroundColor: brandColors.earth500,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seatBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', color: brandColors.textMuted, marginTop: 40 },
});
