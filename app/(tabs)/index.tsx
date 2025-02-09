import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interface for vehicle data
interface VehicleData {
  type: string;
  mpg: number;
  description: string;
}

// Updated CalculationRecord interface now stores emissions values in lbs
interface CalculationRecord {
  id: string;             // Unique id (e.g., a timestamp string)
  date: string;           // ISO string for the calculation date
  miles: string;
  mpg: string;
  emissionsPerDay: string;  // Emissions per day in lbs
  emissionsPerWeek: string; // Emissions per week in lbs
  emissionsPerYear: string; // Emissions per year in lbs
  vehicleType: string;
}

// Helper function to save the calculation record in AsyncStorage
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

// Define our available vehicle data
const vehicleData: { [key: string]: VehicleData } = {
  'Small Car': {
    type: 'Small Car',
    mpg: 32,
    description: 'Compact or sedan (e.g., Honda Accord, Toyota Corolla)',
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
    mpg: 25,
    description: 'Sport Utility Vehicle (e.g., Ford Explorer, Honda CR-V)',
  },
  'Truck': {
    type: 'Truck',
    mpg: 18,
    description: 'Pickup truck (e.g., Ford F-150, Toyota Tundra)',
  },
};

export default function HomeScreen() {
  // Define the default vehicle type
  const defaultVehicleType = 'Small Car';

  // Default input values; initialize mpg from the default vehicle's value.
  const [miles, setMiles] = useState<string>('27');
  const [vehicleType, setVehicleType] = useState<string>(defaultVehicleType);
  const [mpg, setMpg] = useState<string>(String(vehicleData[defaultVehicleType].mpg));
  const [emissions, setEmissions] = useState<string | null>(null); // Daily emissions (in lbs)
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Reset displayed emissions when inputs change
  useEffect(() => {
    setEmissions(null);
  }, [miles, mpg, vehicleType]);

  // When the user selects a vehicle type, update both vehicleType and mpg using the default MPG.
  const handleVehicleTypeChange = (selectedType: string) => {
    setVehicleType(selectedType);
    setMpg(String(vehicleData[selectedType].mpg));
  };

  const validateInputs = (): boolean => {
    const milesNum = parseFloat(miles);
    const mpgNum = parseFloat(mpg);

    if (isNaN(milesNum) || milesNum <= 0) {
      Alert.alert('Invalid Mileage', 'Please enter a valid number of miles greater than 0.');
      return false;
    }

    if (isNaN(mpgNum) || mpgNum <= 0) {
      Alert.alert('Invalid MPG', 'Please enter a valid MPG value greater than 0.');
      return false;
    }

    if (mpgNum > 150) {
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

    return true;
  };

  const calculateEmissions = (bypassValidation: boolean = false): void => {
    if (!bypassValidation && !validateInputs()) return;

    // Capture the current miles value so that we record exactly what the user input.
    const currentMiles = miles;

    setIsCalculating(true);
    Keyboard.dismiss();

    // Simulate calculation time for improved UX
    setTimeout(() => {
      const milesNum = parseFloat(currentMiles);
      const mpgNum = parseFloat(mpg);
      const gallonsUsed = milesNum / mpgNum;
      // Calculate CO₂ emissions using 19.6 lbs CO₂ per gallon (EPA factor)
      const emissionsPerDayLbs = (gallonsUsed * 19.6).toFixed(2);
      const emissionsPerWeekLbs = (gallonsUsed * 19.6 * 5).toFixed(2);      // 5 days per week
      const emissionsPerYearLbs = (gallonsUsed * 19.6 * 5 * 52).toFixed(2);   // 52 weeks per year

      setEmissions(emissionsPerDayLbs);
      const calculationTime = new Date();
      setLastCalculation(calculationTime);
      setIsCalculating(false);

      // Create a record with emissions values in lbs
      const record: CalculationRecord = {
        id: calculationTime.getTime().toString(),
        date: calculationTime.toISOString(),
        // Use the captured currentMiles so that it reflects the user's input at calculation time.
        miles: currentMiles,
        mpg,
        emissionsPerDay: emissionsPerDayLbs,
        emissionsPerWeek: emissionsPerWeekLbs,
        emissionsPerYear: emissionsPerYearLbs,
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

  // Derived values for display (all in lbs)
  const dailyEmissions = emissions ? parseFloat(emissions) : 0;
  const weeklyEmissions = emissions ? (dailyEmissions * 5).toFixed(0) : null;
  const yearlyEmissions = emissions ? (dailyEmissions * 5 * 52).toFixed(0) : null;
  const yearlyCarbonCredits = emissions ? (dailyEmissions * 5 * 52 / 2204.62).toFixed(2) : null;
  const urbanTrees = yearlyEmissions ? (parseFloat(yearlyEmissions) / 86.17).toFixed(0) : null;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Car Commute Calculator
        </ThemedText>
        <ThemedText style={styles.description}>
          Calculate your carbon footprint by entering your trip details below.
        </ThemedText>

        {/* Distance Input */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Distance Traveled Per Day (Miles)</ThemedText>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter miles driven"
              keyboardType="numeric"
              value={miles}
              onChangeText={setMiles}
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.okButton} onPress={() => Keyboard.dismiss()}>
              <ThemedText style={styles.okButtonText}>OK</ThemedText>
            </TouchableOpacity>
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

        {/* Fuel Efficiency */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Fuel Efficiency</ThemedText>
          <View style={styles.efficiencyContainer}>
            <View style={styles.defaultMpgBox}>
              <ThemedText style={styles.defaultMpgLabel}>
                Default MPG for {vehicleType}:
              </ThemedText>
              <ThemedText style={styles.defaultMpgValue}>
                {vehicleData[vehicleType].mpg} MPG
              </ThemedText>
            </View>
            <View style={styles.customMpgContainer}>
              <ThemedText style={styles.label}>Custom MPG (Optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter your exact MPG"
                keyboardType="numeric"
                value={mpg}
                onChangeText={setMpg}
                placeholderTextColor="#666"
              />
              <ThemedText style={styles.helperText}>
                Only enter if you know your vehicle's exact fuel efficiency.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Calculation Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={() => calculateEmissions()}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Calculate CO₂ Emissions</ThemedText>
          )}
        </TouchableOpacity>

        {/* Display Results */}
        {emissions !== null && (
          <View style={styles.resultsContainer}>
            <ThemedText style={styles.emissionsResult}>
              Estimated CO₂ Emissions (Per Day):{' '}
              <ThemedText style={styles.emissionsNumber}>
                {formatNumber(emissions)} lbs
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.emissionsResult}>
              Estimated Weekly CO₂ Emissions (5 days per week):{'\n'}
              <ThemedText style={styles.emissionsNumber}>
                {formatNumber(weeklyEmissions)} lbs
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.emissionsResult}>
              Estimated Yearly CO₂ Emissions:{'\n'}
              <ThemedText style={styles.emissionsNumber}>
                {formatNumber(yearlyEmissions)} lbs
              </ThemedText>
            </ThemedText>

            {/* Carbon Credits */}
            <View style={styles.carbonCreditContainer}>
              <ThemedText style={styles.carbonCreditTitle}>
                Carbon Credit Equivalent
              </ThemedText>
              <ThemedText style={styles.carbonCreditText}>
                One carbon credit is equivalent to 2,204.62 lbs (1 metric ton) of CO₂.
              </ThemedText>
              <ThemedText style={styles.carbonCreditText}>
                Your estimated yearly trip emissions of{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {formatNumber(yearlyEmissions)} lbs
                </ThemedText>{' '}
                represent{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {formatNumber(yearlyCarbonCredits)}
                </ThemedText>{' '}
                carbon credits.
              </ThemedText>
            </View>

            {/* Urban Trees Equivalent */}
            <View style={styles.urbanTreesContainer}>
              <ThemedText style={styles.urbanTreesTitle}>
                Urban Trees Equivalent
              </ThemedText>
              <ThemedText style={styles.urbanTreesText}>
                Your estimated yearly trip emissions of{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {formatNumber(yearlyEmissions)} lbs
                </ThemedText>{' '}
                offset approximately{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {formatNumber(urbanTrees)}
                </ThemedText>{' '}
                urban trees.
              </ThemedText>
              <ThemedText style={styles.urbanTreesText}>
                (Conversion: 1 urban tree offsets ~86.17 lbs of CO₂)
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
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  container: {
    padding: 20,
    paddingTop: 40,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 30,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  okButton: {
    marginLeft: 8,
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dropdownButton: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 16,
    marginBottom: 4,
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  selectedCheck: {
    color: '#2196F3',
    fontSize: 20,
    fontWeight: 'bold',
  },
  efficiencyContainer: {
    gap: 16,
  },
  defaultMpgBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultMpgLabel: {
    fontSize: 14,
    color: '#1976d2',
  },
  defaultMpgValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  customMpgContainer: {
    marginTop: 8,
  },
  calculateButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 0,
    marginBottom: 50,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  emissionsResult: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'left',
  },
  emissionsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'left',
  },
  impactText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 4,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  carbonCreditContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  carbonCreditTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 8,
  },
  carbonCreditText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  urbanTreesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  urbanTreesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#558B2F',
    marginBottom: 8,
  },
  urbanTreesText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  offsetButton: {
    marginTop: 16,
    backgroundColor: '#388E3C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  offsetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { HomeScreen };
