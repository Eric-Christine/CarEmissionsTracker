import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  View,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  useColorScheme,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmissionsComparisonChart from '@/components/EmissionsComparisonChart';

// Define interface for vehicle data
interface VehicleData {
  type: string;
  mpg: number; // MPG for gas vehicles, MPGe for electric vehicles
  description: string;
}

// CalculationRecord stores numeric miles as a string, without units
interface CalculationRecord {
  id: string;
  date: string;
  miles: string;           // always in miles
  fuelEfficiency: string;  // either MPG or L/100 km (stored as typed string)
  emissionsPerDay: string; // in lbs or kg based on user's choice at calculation time
  emissionsPerWeek: string;
  emissionsPerYear: string;
  vehicleType: string;
}

// Helper function to save calculation records in AsyncStorage
const saveCalculationRecord = async (record: CalculationRecord) => {
  try {
    const existing = await AsyncStorage.getItem('@calculation_history');
    const history: CalculationRecord[] = existing ? JSON.parse(existing) : [];
    history.push(record);
    await AsyncStorage.setItem('@calculation_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving calculation record:', error);
  }
};

// Helper function to format numbers with commas (e.g., 1000 => 1,000)
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString('en-US');
};

// Define available vehicle data
const vehicleData: { [key: string]: VehicleData } = {
  'Small Car': {
    type: 'Small Car',
    mpg: 32,
    description: 'Compact or sedan (e.g., Honda Civic, Toyota Corolla)',
  },
  'Hybrid Car': {
    type: 'Hybrid Car',
    mpg: 45,
    description: 'Compact or sedan (e.g., Honda Civic Hybrid, Toyota Prius)',
  },
  'Large Car': {
    type: 'Large Car',
    mpg: 27,
    description: 'Full-size sedan (e.g., Toyota Camry, Honda Accord)',
  },
  'SUV': {
    type: 'SUV',
    mpg: 23,
    description: 'Sport Utility Vehicle (e.g., Ford Explorer, Honda CR-V)',
  },
  'Truck': {
    type: 'Truck',
    mpg: 18,
    description: 'Pickup truck (e.g., Ford F-150, Toyota Tundra)',
  },
  'Bus': {
    type: 'Bus',
    mpg: 6,
    description:
      'Transit bus (~6 MPG). Emissions per person based on half occupancy (15 passengers).',
  },
  'E-bike': {
    type: 'E-bike',
    mpg: 842, // MPGe based on ~0.04 kWh/mi and typical grid emissions
    description:
      'Electric bike. Emissions based on ~0.04 kWh/mi and 0.92 lbs CO₂/kWh.',
  },
  'Motorcycle': {
    type: 'Motorcycle',
    mpg: 40,
    description:
      'Motorcycle. More fuel efficient than cars, but uses gasoline.',
  },
  'Subway': {
    type: 'Subway',
    mpg: 198, // MPGe based on ~0.17 kWh/passenger-mile and typical grid emissions
    description:
      'Subway/Metro rail. Highly efficient mass transit with ~0.17 kWh/passenger-mile.',
  },
};

// Theme colors
const colors = {
  light: {
    background: '#fff',
    surface: '#f8f9fa',
    primary: '#2196F3',
    primaryDark: '#1976d2',
    text: '#333',
    textSecondary: '#666',
    textLight: '#999',
    border: '#ccc',
    success: '#388E3C',
    successLight: '#e8f5e9',
    successDark: '#558B2F',
    inputBackground: '#fff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    selectedBackground: '#e3f2fd',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#90caf9',
    primaryDark: '#64b5f6',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textLight: '#757575',
    border: '#404040',
    success: '#81c784',
    successLight: '#1b3320',
    successDark: '#a5d6a7',
    inputBackground: '#2c2c2c',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    selectedBackground: '#1e3646',
  }
};

// Create themed styles based on the current theme
const createThemedStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: colors[theme].background,
      paddingBottom: 60,
    },
    container: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: colors[theme].background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 30,
      textAlign: 'center',
      color: colors[theme].text,
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 10,
      color: colors[theme].textSecondary,
    },
    toggleContainer: {
      marginVertical: 10,
      alignItems: 'center',
    },
    toggleButton: {
      padding: 10,
      backgroundColor: colors[theme].primary,
      borderRadius: 5,
    },
    toggleButtonText: {
      color: theme === 'dark' ? '#000' : '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    sectionContainer: {
      marginBottom: 10,
      backgroundColor: colors[theme].surface,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors[theme].primary,
    },
    inputGroup: {
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: colors[theme].text,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: colors[theme].border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors[theme].inputBackground,
      color: colors[theme].text,
    },
    okButton: {
      marginLeft: 8,
      backgroundColor: colors[theme].primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 4,
    },
    okButtonText: {
      color: theme === 'dark' ? '#000' : '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    helperText: {
      fontSize: 12,
      color: colors[theme].textSecondary,
      marginTop: 4,
    },
    dropdownButton: {
      height: 50,
      width: '100%',
      backgroundColor: colors[theme].inputBackground,
      borderRadius: 8,
      marginVertical: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors[theme].border,
      marginBottom: 10,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: colors[theme].text,
    },
    dropdownIcon: {
      fontSize: 14,
      color: colors[theme].textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors[theme].modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors[theme].surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors[theme].border,
    },
    dropdownTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors[theme].text,
    },
    closeButton: {
      fontSize: 20,
      color: colors[theme].textSecondary,
      padding: 4,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors[theme].border,
    },
    dropdownItemSelected: {
      backgroundColor: colors[theme].selectedBackground,
    },
    dropdownItemText: {
      fontSize: 16,
      marginBottom: 4,
      color: colors[theme].text,
    },
    dropdownItemDescription: {
      fontSize: 12,
      color: colors[theme].textSecondary,
    },
    selectedCheck: {
      color: colors[theme].primary,
      fontSize: 20,
      fontWeight: 'bold',
    },
    efficiencyContainer: {
      marginBottom: 16,
    },
    defaultFuelBox: {
      backgroundColor: colors[theme].selectedBackground,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    defaultFuelLabel: {
      fontSize: 14,
      color: colors[theme].primaryDark,
      flexWrap: 'wrap',
    },
    defaultFuelValue: {
      fontSize: 16,
      fontWeight: 'bold',
      flexWrap: 'wrap',
      color: colors[theme].primaryDark,
    },
    customFuelContainer: {
      marginTop: 8,
    },
    calculateButton: {
      backgroundColor: colors[theme].primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 0,
      marginBottom: 10,
    },
    buttonText: {
      color: theme === 'dark' ? '#000' : '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    resultsContainer: {
      marginTop: 0,
      marginBottom: 50,
      padding: 15,
      backgroundColor: colors[theme].surface,
      borderRadius: 8,
      alignItems: 'flex-start',
      width: '100%',
    },
    emissionsResult: {
      fontSize: 18,
      fontWeight: '600',
      color: colors[theme].text,
      marginBottom: 8,
      textAlign: 'left',
    },
    emissionsNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors[theme].primary,
      textAlign: 'left',
    },
    impactText: {
      fontSize: 16,
      fontStyle: 'italic',
      color: colors[theme].textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    timestamp: {
      fontSize: 12,
      color: colors[theme].textLight,
      marginTop: 4,
      textAlign: 'center',
    },
    carbonCreditContainer: {
      marginTop: 20,
      padding: 15,
      backgroundColor: colors[theme].successLight,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
    },
    carbonCreditTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors[theme].success,
      marginBottom: 8,
    },
    carbonCreditText: {
      fontSize: 14,
      color: colors[theme].textSecondary,
      textAlign: 'center',
    },
    urbanTreesContainer: {
      marginTop: 20,
      padding: 15,
      backgroundColor: colors[theme].successLight,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
    },
    urbanTreesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors[theme].success,
      marginBottom: 8,
    },
    urbanTreesText: {
      fontSize: 14,
      color: colors[theme].textSecondary,
      textAlign: 'center',
    },
    offsetButton: {
      marginTop: 16,
      backgroundColor: colors[theme].success,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    offsetButtonText: {
      color: theme === 'dark' ? '#000' : '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default function HomeScreen() {
  // Detect system color scheme
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = createThemedStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);

  // Default vehicle
  const defaultVehicleType = 'SUV';

  // Single global toggle: stored in AsyncStorage
  const [isMetric, setIsMetric] = useState<boolean>(false);

  // Load isMetric from AsyncStorage on mount
  useEffect(() => {
    const loadIsMetric = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('@is_metric');
        if (storedValue !== null) {
          setIsMetric(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('Error loading isMetric preference:', error);
      }
    };
    loadIsMetric();
  }, []);

  // Distance input
  const [miles, setMiles] = useState<string>('35');
  const [vehicleType, setVehicleType] = useState<string>(defaultVehicleType);

  // Fuel efficiency: MPG if Imperial, L/100 km if Metric
  const [fuelEfficiency, setFuelEfficiency] = useState<string>(
    isMetric
      ? (235.214 / vehicleData[defaultVehicleType].mpg).toFixed(2)
      : String(vehicleData[defaultVehicleType].mpg)
  );

  // Emissions results
  const [emissions, setEmissions] = useState<string | null>(null); // daily
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Update fuel efficiency when isMetric or vehicleType changes
  useEffect(() => {
    setFuelEfficiency(
      isMetric
        ? (235.214 / vehicleData[vehicleType].mpg).toFixed(2)
        : String(vehicleData[vehicleType].mpg)
    );
  }, [isMetric, vehicleType]);

  // Reset emissions if inputs change
  useEffect(() => {
    setEmissions(null);
  }, [miles, fuelEfficiency, vehicleType]);

  // Switch measurement system + convert distance
  const handleToggleMeasurement = async () => {
    const distanceValue = parseFloat(miles);
    if (!isNaN(distanceValue)) {
      // If currently metric, convert to miles; if imperial, convert to km
      const converted = isMetric
        ? distanceValue / 1.60934
        : distanceValue * 1.60934;
      setMiles(converted.toFixed(2));
    }
    const newValue = !isMetric;
    setIsMetric(newValue);

    // Save preference in AsyncStorage
    try {
      await AsyncStorage.setItem('@is_metric', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving isMetric preference:', error);
    }
  };

  // Select vehicle
  const handleVehicleTypeChange = (selectedType: string) => {
    setVehicleType(selectedType);
    setFuelEfficiency(
      isMetric
        ? (235.214 / vehicleData[selectedType].mpg).toFixed(2)
        : String(vehicleData[selectedType].mpg)
    );
  };

  // Validate inputs
  const validateInputs = (): boolean => {
    const distanceValue = parseFloat(miles);
    if (isNaN(distanceValue) || distanceValue <= 0) {
      Alert.alert('Invalid Distance', 'Please enter a valid distance > 0.');
      return false;
    }
    if (vehicleType !== 'E-bike' && vehicleType !== 'Subway') {
      const feNum = parseFloat(fuelEfficiency);
      if (isNaN(feNum) || feNum <= 0) {
        Alert.alert(
          isMetric ? 'Invalid Fuel Consumption' : 'Invalid MPG',
          isMetric
            ? 'Please enter a valid fuel consumption in L/100 km > 0.'
            : 'Please enter a valid MPG > 0.'
        );
        return false;
      }
      if (!isMetric && feNum > 150) {
        Alert.alert(
          'MPG Verification',
          'The MPG value seems unusually high. Please verify your input.',
          [
            { text: 'Edit', style: 'cancel' },
            { text: 'Continue', onPress: () => calculateEmissions(true) },
          ]
        );
        return false;
      }
    }
    return true;
  };

  // Calculate Emissions
  const calculateEmissions = (bypassValidation: boolean = false): void => {
    if (!bypassValidation && !validateInputs()) return;

    const inputDistance = parseFloat(miles);
    // Convert user-entered distance to "raw miles" internally
    const milesNum = isMetric ? inputDistance / 1.60934 : inputDistance;
    setIsCalculating(true);
    Keyboard.dismiss();

    setTimeout(() => {
      let emissionsPerDay: string;
      let emissionsPerWeek: string;
      let emissionsPerYear: string;

      if (vehicleType === 'Bus') {
        // Approx. 22.45 lbs CO₂ per gallon, 6 MPG, 15 passengers
        // perMilePerPerson = 22.45 / 6 / 15
        const perMilePerPerson = 22.45 / 6 / 15;
        let day = milesNum * perMilePerPerson;
        let week = day * 5;
        let year = day * 5 * 52;
        if (isMetric) {
          day *= 0.453592;
          week *= 0.453592;
          year *= 0.453592;
        }
        emissionsPerDay = day.toFixed(2);
        emissionsPerWeek = week.toFixed(2);
        emissionsPerYear = year.toFixed(2);
      } else if (vehicleType === 'E-bike' || vehicleType === 'Subway') {
        // For electric vehicles with MPGe
        // Convert MPGe to kWh/mile: 33.7 kWh = 1 gallon gasoline equivalent
        const kWhPerMile = 33.7 / vehicleData[vehicleType].mpg;
        // Use 0.92 lbs CO₂/kWh as average US grid emissions
        const co2PerMile = kWhPerMile * 0.92;
        
        let day = milesNum * co2PerMile;
        let week = day * 5;
        let year = day * 5 * 52;
        if (isMetric) {
          day *= 0.453592;
          week *= 0.453592;
          year *= 0.453592;
        }
        emissionsPerDay = day.toFixed(2);
        emissionsPerWeek = week.toFixed(2);
        emissionsPerYear = year.toFixed(2);
      } else {
        // For traditional gas vehicles
        const feNum = parseFloat(fuelEfficiency);
        const mpgValue = !isMetric ? feNum : 235.214 / feNum;
        const gallonsUsed = milesNum / mpgValue;
        // 19.6 lbs CO₂ per gallon of gasoline
        let day = gallonsUsed * 19.6;
        let week = day * 5;
        let year = day * 5 * 52;
        if (isMetric) {
          day *= 0.453592;
          week *= 0.453592;
          year *= 0.453592;
        }
        emissionsPerDay = day.toFixed(2);
        emissionsPerWeek = week.toFixed(2);
        emissionsPerYear = year.toFixed(2);
      }

      setEmissions(emissionsPerDay);
      const calculationTime = new Date();
      setLastCalculation(calculationTime);
      setIsCalculating(false);

      // Store numeric miles in the record (no appended units)
      const record: CalculationRecord = {
        id: calculationTime.getTime().toString(),
        date: calculationTime.toISOString(),
        miles: milesNum.toFixed(2), // always store miles
        fuelEfficiency,
        emissionsPerDay,
        emissionsPerWeek,
        emissionsPerYear,
        vehicleType,
      };

      saveCalculationRecord(record);
    }, 800);
  };

  const getEmissionsImpact = (emissions: number): string => {
    if (emissions < 10) return 'Low environmental impact';
    if (emissions < 50) return 'Moderate environmental impact';
    return 'High environmental impact - Consider carpooling or alternative transport';
  };

  // For displaying results
  const dailyEmissions = emissions ? parseFloat(emissions) : 0;
  const weeklyEmissions = emissions ? (dailyEmissions * 5).toFixed(0) : null;
  const yearlyEmissions = emissions ? (dailyEmissions * 5 * 52).toFixed(0) : null;
  const yearlyCarbonCredits = emissions
    ? (dailyEmissions * 5 * 52 / (isMetric ? 1000 : 2204.62)).toFixed(2)
    : null;
  const urbanTrees = yearlyEmissions
    ? (parseFloat(yearlyEmissions) / (isMetric ? 39.14 : 86.17)).toFixed(0)
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Carbon Commute Calculator
          </ThemedText>
          <ThemedText style={styles.description}>
            Calculate your carbon footprint by entering your trip details below.
          </ThemedText>

          {/* Measurement Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={handleToggleMeasurement}
            >
              <ThemedText style={styles.toggleButtonText}>
                {isMetric ? 'Switch to Imperial (Miles, lbs)' : 'Switch to Metric (KM, kg)'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Distance Input */}
          <View style={styles.sectionContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.sectionTitle}>
                Distance Traveled Per Day ({isMetric ? 'KM' : 'Miles'})
              </ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={
                    isMetric ? 'Enter kilometers traveled' : 'Enter miles driven'
                  }
                  keyboardType="numeric"
                  value={miles}
                  onChangeText={setMiles}
                  placeholderTextColor={colors[theme].textSecondary}
                />
                <TouchableOpacity style={styles.okButton} onPress={() => Keyboard.dismiss()}>
                  <ThemedText style={styles.okButtonText}>OK</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Vehicle Information</ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Select Vehicle Type</ThemedText>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsDropdownOpen(true)}>
                <ThemedText style={styles.dropdownButtonText}>{vehicleType}</ThemedText>
                <ThemedText style={styles.dropdownIcon}>▼</ThemedText>
              </TouchableOpacity>

              <Modal
                visible={isDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDropdownOpen(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setIsDropdownOpen(false)}
                >
                  <View style={styles.dropdownContainer}>
                    <View style={styles.dropdownHeader}>
                      <ThemedText style={styles.dropdownTitle}>Select Vehicle Type</ThemedText>
                      <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                        <ThemedText style={styles.closeButton}>✕</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={Object.values(vehicleData)}
                      keyExtractor={(item) => item.type}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            vehicleType === item.type && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            handleVehicleTypeChange(item.type);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <View>
                            <ThemedText style={styles.dropdownItemText}>{item.type}</ThemedText>
                            <ThemedText style={styles.dropdownItemDescription}>
                              {item.description}
                            </ThemedText>
                          </View>
                          {vehicleType === item.type && (
                            <ThemedText style={styles.selectedCheck}>✓</ThemedText>
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
              <ThemedText style={styles.helperText}>
                {vehicleData[vehicleType].description}
              </ThemedText>
            </View>
          </View>

          {/* Fuel Efficiency Section (for non-E-bike and non-Subway vehicles) */}
          {vehicleType !== 'E-bike' && vehicleType !== 'Subway' && (
            <View style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>Fuel Efficiency</ThemedText>
              <View style={styles.efficiencyContainer}>
                <View style={styles.defaultFuelBox}>
                  <ThemedText style={styles.defaultFuelLabel}>
                    {isMetric
                      ? `Default Fuel Consumption for ${vehicleType}:`
                      : `Default MPG for ${vehicleType}:`}
                  </ThemedText>
                  <ThemedText style={styles.defaultFuelValue}>
                    {isMetric
                      ? (235.214 / vehicleData[vehicleType].mpg).toFixed(2) + ' L/100 km'
                      : vehicleData[vehicleType].mpg + ' MPG'}
                  </ThemedText>
                </View>
                <View style={styles.customFuelContainer}>
                  <ThemedText style={styles.label}>
                    {isMetric ? 'Custom L/100 km (Optional)' : 'Custom MPG (Optional)'}
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      isMetric
                        ? 'Enter your exact fuel consumption in L/100 km'
                        : 'Enter your exact MPG'
                    }
                    keyboardType="numeric"
                    value={fuelEfficiency}
                    onChangeText={setFuelEfficiency}
                    placeholderTextColor={colors[theme].textSecondary}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                  />
                  <ThemedText style={styles.helperText}>
                    Only enter if you know your vehicle’s exact fuel efficiency.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Fuel Efficiency Section for E-bike and Subway */}
          {(vehicleType === 'E-bike' || vehicleType === 'Subway') && (
            <View style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>Fuel Efficiency</ThemedText>
              <View style={styles.efficiencyContainer}>
                <View style={styles.defaultFuelBox}>
                  <ThemedText style={styles.defaultFuelLabel}>
                    Default MPGe for {vehicleType}:
                  </ThemedText>
                  <ThemedText style={styles.defaultFuelValue}>
                    {vehicleData[vehicleType].mpg} MPGe
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Calculation Button */}
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={() => calculateEmissions()}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <ActivityIndicator color={theme === 'dark' ? '#000' : '#fff'} />
            ) : (
              <ThemedText style={styles.buttonText}>Calculate CO₂ Emissions</ThemedText>
            )}
          </TouchableOpacity>

          {/* Display Results */}
          {emissions !== null && (
            <View style={styles.resultsContainer}>
              <ThemedText style={styles.emissionsResult}>
                Estimated CO₂ Emissions (Per Day):{'\n'}
                <ThemedText style={styles.emissionsNumber}>
                  {formatNumber(emissions)} {isMetric ? 'kg' : 'lbs'}
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.emissionsResult}>
                Estimated Weekly CO₂ Emissions (5 days per week):{'\n'}
                <ThemedText style={styles.emissionsNumber}>
                  {weeklyEmissions && formatNumber(weeklyEmissions)} {isMetric ? 'kg' : 'lbs'}
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.emissionsResult}>
                Estimated Yearly CO₂ Emissions:{'\n'}
                <ThemedText style={styles.emissionsNumber}>
                  {yearlyEmissions && formatNumber(yearlyEmissions)} {isMetric ? 'kg' : 'lbs'}
                </ThemedText>
              </ThemedText>
              {/* Emissions Comparison Chart */}
              <EmissionsComparisonChart 
                currentEmissions={{
                  daily: emissions,
                  weekly: weeklyEmissions,
                  yearly: yearlyEmissions
                }}
                isMetric={isMetric}
              />
              {/* Carbon Credits */}
              <View style={styles.carbonCreditContainer}>
                <ThemedText style={styles.carbonCreditTitle}>Carbon Credit Equivalent</ThemedText>
                <ThemedText style={styles.carbonCreditText}>
                  {isMetric
                    ? 'One carbon credit = 1,000 kg (1 metric ton) of CO₂.'
                    : 'One carbon credit = 2,204.62 lbs (1 metric ton) of CO₂.'}
                </ThemedText>
                <ThemedText style={styles.carbonCreditText}>
                  Your estimated yearly trip emissions of{' '}
                  <ThemedText style={styles.emissionsNumber}>
                    {yearlyEmissions && formatNumber(yearlyEmissions)} {isMetric ? 'kg' : 'lbs'}
                  </ThemedText>{' '}
                  represent{' '}
                  <ThemedText style={styles.emissionsNumber}>
                    {yearlyCarbonCredits && formatNumber(yearlyCarbonCredits)}
                  </ThemedText>{' '}
                  carbon credits.
                </ThemedText>
              </View>

              {/* Urban Trees Equivalent */}
              <View style={styles.urbanTreesContainer}>
                <ThemedText style={styles.urbanTreesTitle}>Urban Trees Equivalent</ThemedText>
                <ThemedText style={styles.urbanTreesText}>
                  Your estimated yearly trip emissions of{' '}
                  <ThemedText style={styles.emissionsNumber}>
                    {yearlyEmissions && formatNumber(yearlyEmissions)} {isMetric ? 'kg' : 'lbs'}
                  </ThemedText>{' '}
                  offset approximately{' '}
                  <ThemedText style={styles.emissionsNumber}>
                    {urbanTrees && formatNumber(urbanTrees)}
                  </ThemedText>{' '}
                  urban trees.
                </ThemedText>
                <ThemedText style={styles.urbanTreesText}>
                  (Conversion: 1 urban tree offsets ~
                  {isMetric ? '39.14 kg' : '86.17 lbs'} of CO₂)
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.offsetButton}
                onPress={() =>
                  Linking.openURL('https://terrapass.com/product/productindividuals-families/')
                }
              >
                <ThemedText style={styles.offsetButtonText}>
                  Purchase Carbon Credits to Offset Your Emissions
                </ThemedText>
              </TouchableOpacity>

              <ThemedText style={styles.impactText}>
                {getEmissionsImpact(dailyEmissions)}
              </ThemedText>

              {lastCalculation && (
                <ThemedText style={styles.timestamp}>
                  Last calculated: {lastCalculation.toLocaleTimeString()}
                </ThemedText>
              )}
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}