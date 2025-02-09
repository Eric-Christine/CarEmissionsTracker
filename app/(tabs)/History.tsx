import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  useColorScheme 
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

// Theme colors consistent with the app's theme
const colors = {
  light: {
    background: '#fff',
    surface: '#f8f9fa',
    primary: '#2196F3',
    danger: '#d32f2f',
    text: '#333',
    textSecondary: '#666',
    textLight: '#999',
    border: '#ccc',
    cardBackground: '#f5f5f5',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#90caf9',
    danger: '#ef5350',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textLight: '#757575',
    border: '#404040',
    cardBackground: '#2c2c2c',
  }
};

// Helper function to format numeric strings with commas
const formatNumber = (value: string): string => {
  const num = Number(value);
  return isNaN(num) ? value : num.toLocaleString('en-US');
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = colors[theme];

  // Load calculation history from AsyncStorage
  const loadHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@calculation_history');
      if (jsonValue) {
        const parsedHistory: CalculationRecord[] = JSON.parse(jsonValue);
        // Reverse the history so the most recent record shows first
        setHistory(parsedHistory.reverse());
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load calculation history', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  // Clear history with confirmation
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

  const renderItem = ({ item }: { item: CalculationRecord }) => (
    <View style={[styles.recordItem, { backgroundColor: themeColors.cardBackground }]}>
      <ThemedText style={[styles.recordDate, { color: themeColors.textSecondary }]}>
        {new Date(item.date).toLocaleString()}
      </ThemedText>
      <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
        Vehicle: {item.vehicleType}
      </ThemedText>
      <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
        Miles: {formatNumber(item.miles)} | MPG: {formatNumber(item.mpg)}
      </ThemedText>
      <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
        Emissions Per Day: {formatNumber(item.emissionsPerDay)} lbs CO₂
      </ThemedText>
      <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
        Emissions Per Week: {formatNumber(item.emissionsPerWeek)} lbs CO₂
      </ThemedText>
      <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
        Emissions Per Year: {formatNumber(item.emissionsPerYear)} lbs CO₂
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ThemedText type="title" style={[styles.title, { color: themeColors.text }]}>
        Calculation History
      </ThemedText>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <ThemedText style={[styles.emptyText, { color: themeColors.textLight }]}>
            No calculation history available.
          </ThemedText>
        }
        contentContainerStyle={styles.listContent}
      />
      {/* Render Clear History button only if there is at least one record */}
      {history.length > 0 && (
        <TouchableOpacity 
          style={[styles.clearButton, { backgroundColor: themeColors.danger }]} 
          onPress={clearHistory}
        >
          <ThemedText style={styles.clearButtonText}>
            Clear History
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 100,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  recordItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  recordText: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  clearButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 100,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { HistoryScreen };
