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

interface CalculationRecord {
  id: string;
  date: string;
  miles: string;           // always stored as numeric miles
  fuelEfficiency: string;  // either MPG or L/100 km
  emissionsPerDay: string; // stored in lbs or kg at calc time
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
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString('en-US');
};

// Conversion helper functions (Imperial → Metric)
const convertMilesToKm = (miles: number): number => miles * 1.60934;
const convertMPGToLper100Km = (mpg: number): number => 235.214 / mpg;
const convertLbsToKg = (lbs: number): number => lbs * 0.453592;

export default function HistoryScreen() {
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  // Single global toggle, loaded from AsyncStorage
  const [isMetric, setIsMetric] = useState<boolean>(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = colors[theme];

  // Load both history and isMetric preference
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

  // Load calculation history from AsyncStorage
  const loadHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@calculation_history');
      if (jsonValue) {
        const parsedHistory: CalculationRecord[] = JSON.parse(jsonValue);
        // Reverse so the most recent record is first
        setHistory(parsedHistory.reverse());
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load calculation history', error);
    }
  };

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

  // Toggle measurement system from the History screen as well
  const handleToggleMeasurement = async () => {
    const newValue = !isMetric;
    setIsMetric(newValue);
    try {
      await AsyncStorage.setItem('@is_metric', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving isMetric preference:', error);
    }
  };

  // Render a single history record
  const renderItem = ({ item }: { item: CalculationRecord }) => {
    // 'miles' is stored as numeric miles
    const storedMiles = parseFloat(item.miles);

    // Convert to user’s preferred system for display
    const displayDistance = isMetric
      ? formatNumber(convertMilesToKm(storedMiles).toFixed(2)) + ' km'
      : formatNumber(storedMiles.toFixed(2)) + ' miles';

    // Convert the stored fuel efficiency if needed
    const feNum = parseFloat(item.fuelEfficiency); // might be MPG or L/100
    let displayFuel: string;
    if (item.vehicleType === 'E-bike') {
      // E-bike has no "mpg" but let's just show the stored string or N/A
      displayFuel = 'N/A';
    } else {
      if (isMetric) {
        // If stored was MPG, convert to L/100 km
        // But if the user typed a custom L/100 in the Home screen, 
        // that was already stored as a string. We only do a real conversion 
        // if it was in MPG. So let's assume it was in the correct format:
        // - If isMetric was true at calc time, `feNum` is already L/100.
        // - If isMetric was false at calc time, `feNum` is MPG.
        // For simplicity, let's always assume it's MPG if isMetric is false *now*.
        // A safer approach is to store a "unitSystem" with the record, but we'll keep it simple.
        // We'll just do a naive "MPG to L/100" conversion if isMetric is on:
        // This might be approximate if user typed L/100 originally.
        const mpgAsNumber = feNum; 
        const lPer100km = convertMPGToLper100Km(mpgAsNumber);
        displayFuel = formatNumber(lPer100km.toFixed(2)) + ' L/100 km';
      } else {
        // Show it as MPG
        displayFuel = formatNumber(feNum.toFixed(2)) + ' MPG';
      }
    }

    // Emissions
    // The item’s emissions were stored in either lbs or kg, depending on the user’s system at the time.
    // We can interpret them as lbs if isMetric = false, or convert to kg if isMetric = true.
    const dayLbs = parseFloat(item.emissionsPerDay);
    const weekLbs = parseFloat(item.emissionsPerWeek);
    const yearLbs = parseFloat(item.emissionsPerYear);

    const displayDay = isMetric
      ? formatNumber(convertLbsToKg(dayLbs).toFixed(2)) + ' kg CO₂'
      : formatNumber(dayLbs.toFixed(2)) + ' lbs CO₂';

    const displayWeek = isMetric
      ? formatNumber(convertLbsToKg(weekLbs).toFixed(2)) + ' kg CO₂'
      : formatNumber(weekLbs.toFixed(2)) + ' lbs CO₂';

    const displayYear = isMetric
      ? formatNumber(convertLbsToKg(yearLbs).toFixed(2)) + ' kg CO₂'
      : formatNumber(yearLbs.toFixed(2)) + ' lbs CO₂';

    // Carbon credits
    // The record was stored as lbs or kg. If we assume it's always lbs in the record, we can do:
    const yearlyEmissionsNum = yearLbs; 
    const carbonCredits = isMetric
      ? (convertLbsToKg(yearlyEmissionsNum) / 1000).toFixed(2)
      : (yearlyEmissionsNum / 2204.62).toFixed(2);
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

      {/* Measurement Toggle (shares the same @is_metric key) */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,  
            { 
              backgroundColor: themeColors.primary,
              borderColor: themeColors.border,
              borderWidth: 1,
            }
          ]}
          onPress={handleToggleMeasurement}
        >
          <ThemedText style={[
            styles.toggleButtonText, 
            { color: colorScheme === 'dark' ? '#000' : '#fff' }
          ]}>
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
