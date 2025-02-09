import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect } from '@react-navigation/native';

// Define the CalculationRecord interface
interface CalculationRecord {
  id: string;
  date: string;
  miles: string;
  mpg: string;
  emissionsPerDay: string;
  emissionsPerWeek: string;
  emissionsPerYear: string;
  vehicleType: string;
}

// Helper function to format numeric strings with commas
const formatNumber = (value: string): string => {
  const num = Number(value);
  return isNaN(num) ? value : num.toLocaleString('en-US');
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<CalculationRecord[]>([]);

  // Load calculation history from AsyncStorage and reverse the order
  const loadHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@calculation_history');
      if (jsonValue) {
        // Parse and reverse the array so that the newest records appear first
        const parsedHistory: CalculationRecord[] = JSON.parse(jsonValue);
        setHistory(parsedHistory.reverse());
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load calculation history', error);
    }
  };

  // Use useFocusEffect to load history each time the screen is focused.
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  // Clear history with a confirmation alert
  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your calculation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@calculation_history');
              setHistory([]);
            } catch (error) {
              console.error('Failed to clear calculation history', error);
            }
          } 
        }
      ]
    );
  };

  // Render each record in the list with formatted numbers
  const renderItem = ({ item }: { item: CalculationRecord }) => {
    const formattedMiles = formatNumber(item.miles);
    const formattedMpg = formatNumber(item.mpg);
    const formattedEmissionsPerDay = formatNumber(item.emissionsPerDay);
    const formattedEmissionsPerWeek = formatNumber(item.emissionsPerWeek);
    const formattedEmissionsPerYear = formatNumber(item.emissionsPerYear);

    return (
      <View style={styles.recordItem}>
        <ThemedText style={styles.recordDate}>
          {new Date(item.date).toLocaleString()}
        </ThemedText>
        <ThemedText style={styles.recordText}>
          Vehicle: {item.vehicleType}
        </ThemedText>
        <ThemedText style={styles.recordText}>
          Miles: {formattedMiles} | MPG: {formattedMpg}
        </ThemedText>
        <ThemedText style={styles.recordText}>
          Emissions Per Day: {formattedEmissionsPerDay} lbs CO₂
        </ThemedText>
        <ThemedText style={styles.recordText}>
          Emissions Per Week: {formattedEmissionsPerWeek} lbs CO₂
        </ThemedText>
        <ThemedText style={styles.recordText}>
          Emissions Per Year: {formattedEmissionsPerYear} lbs CO₂
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Calculation History
      </ThemedText>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No calculation history available.
          </ThemedText>
        }
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
        <ThemedText style={styles.clearButtonText}>
          Clear History
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    marginTop: 100,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  recordItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recordText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { HistoryScreen };
