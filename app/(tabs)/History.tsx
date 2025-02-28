import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect } from '@react-navigation/native';

interface CalculationRecord {
  id: string;
  date: string;
  miles: string;           // always stored as numeric miles
  fuelEfficiency: string;  // value as string, in MPG, L/100 km, or MPGe
  fuelEfficiencyUnit: 'mpg' | 'l/100km' | 'mpge'; // unit at calculation time
  emissionsPerDay: string; // value as string, in lbs or kg
  emissionsPerWeek: string;
  emissionsPerYear: string;
  emissionsUnit: 'lbs' | 'kg'; // unit at calculation time
  vehicleType: string;
}

// Theme colors
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
  },
};

// Helper functions
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString('en-US');
};

const convertMilesToKm = (miles: number): number => miles * 1.60934;
const convertMPGToLper100Km = (mpg: number): number => 235.214 / mpg;
const convertLbsToKg = (lbs: number): number => lbs * 0.453592;

export default function HistoryScreen() {
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [isMetric, setIsMetric] = useState<boolean>(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = colors[theme];

  useFocusEffect(
    useCallback(() => {
      loadIsMetric();
      loadHistory();
    }, [])
  );

  const loadIsMetric = async () => {
    try {
      const storedValue = await AsyncStorage.getItem('@is_metric');
      if (storedValue !== null) {
        setIsMetric(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error('Failed to load isMetric preference', error);
    }
  };

  const loadHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@calculation_history');
      if (jsonValue) {
        const parsedHistory: CalculationRecord[] = JSON.parse(jsonValue);
        setHistory(parsedHistory.reverse());
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load calculation history', error);
    }
  };

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
          },
        },
      ]
    );
  };

  const handleToggleMeasurement = async () => {
    const newValue = !isMetric;
    setIsMetric(newValue);
    try {
      await AsyncStorage.setItem('@is_metric', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving isMetric preference:', error);
    }
  };

  const renderItem = ({ item }: { item: CalculationRecord }) => {
    const storedMiles = parseFloat(item.miles);
    const displayDistance = isMetric
      ? `${formatNumber(convertMilesToKm(storedMiles).toFixed(2))} km`
      : `${formatNumber(storedMiles.toFixed(2))} miles`;

    const feNum = parseFloat(item.fuelEfficiency);
    let displayFuel: string;
    const isElectric = item.vehicleType === 'E-bike' || item.vehicleType === 'Subway';
    const fuelUnit = item.fuelEfficiencyUnit || (isElectric ? 'mpge' : 'mpg');

    if (fuelUnit === 'mpge') {
      if (isMetric) {
        const mpge = feNum;
        const kmPerKWh = (convertMilesToKm(mpge) / 33.7).toFixed(2);
        displayFuel = `${formatNumber(mpge)} MPGe (${kmPerKWh} km/kWh)`;
      } else {
        displayFuel = `${formatNumber(feNum)} MPGe`;
      }
    } else {
      if (isMetric) {
        if (fuelUnit === 'mpg') {
          const lPer100km = convertMPGToLper100Km(feNum);
          displayFuel = `${formatNumber(lPer100km.toFixed(2))} L/100 km`;
        } else {
          displayFuel = `${formatNumber(feNum)} L/100 km`;
        }
      } else {
        if (fuelUnit === 'l/100km') {
          const mpg = 235.214 / feNum;
          displayFuel = `${formatNumber(mpg.toFixed(2))} MPG`;
        } else {
          displayFuel = `${formatNumber(feNum)} MPG`;
        }
      }
    }

    const emissionsUnit = item.emissionsUnit || 'lbs';
    const dayNum = parseFloat(item.emissionsPerDay);
    const weekNum = parseFloat(item.emissionsPerWeek);
    const yearNum = parseFloat(item.emissionsPerYear);

    const displayDay = isMetric
      ? `${formatNumber((emissionsUnit === 'kg' ? dayNum : convertLbsToKg(dayNum)).toFixed(2))} kg CO₂`
      : `${formatNumber((emissionsUnit === 'lbs' ? dayNum : dayNum / 0.453592).toFixed(2))} lbs CO₂`;

    const displayWeek = isMetric
      ? `${formatNumber((emissionsUnit === 'kg' ? weekNum : convertLbsToKg(weekNum)).toFixed(2))} kg CO₂`
      : `${formatNumber((emissionsUnit === 'lbs' ? weekNum : weekNum / 0.453592).toFixed(2))} lbs CO₂`;

    const displayYear = isMetric
      ? `${formatNumber((emissionsUnit === 'kg' ? yearNum : convertLbsToKg(yearNum)).toFixed(2))} kg CO₂`
      : `${formatNumber((emissionsUnit === 'lbs' ? yearNum : yearNum / 0.453592).toFixed(2))} lbs CO₂`;

    const yearKg = emissionsUnit === 'kg' ? yearNum : convertLbsToKg(yearNum);
    const carbonCredits = (yearKg / 1000).toFixed(2);
    const displayCarbonCredits = `${formatNumber(carbonCredits)} carbon credits`;

    return (
      <View style={[styles.recordItem, { backgroundColor: themeColors.cardBackground }]}>
        <ThemedText style={[styles.recordDate, { color: themeColors.textSecondary }]}>
          {new Date(item.date).toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Vehicle: {item.vehicleType}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Distance: {displayDistance} | Fuel: {displayFuel}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Emissions Per Day: {displayDay}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Emissions Per Week: {displayWeek}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Emissions Per Year: {displayYear}
        </ThemedText>
        <ThemedText style={[styles.recordText, { color: themeColors.text }]}>
          Carbon Credits to Offset Yearly Emissions: {displayCarbonCredits}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ThemedText type="title" style={[styles.title, { color: themeColors.text }]}>
        Calculation History
      </ThemedText>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: themeColors.primary, borderColor: themeColors.border, borderWidth: 1 },
          ]}
          onPress={handleToggleMeasurement}
        >
          <ThemedText
            style={[styles.toggleButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}
          >
            {isMetric ? 'Switch to Imperial (Miles, lbs)' : 'Switch to Metric (KM, kg)'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
      {history.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: themeColors.danger }]}
          onPress={clearHistory}
        >
          <ThemedText style={styles.clearButtonText}>Clear History</ThemedText>
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
    marginTop: 50,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 2 },
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