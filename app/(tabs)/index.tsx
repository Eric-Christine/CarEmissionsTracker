// HomeScreen.tsx
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

// Define interface for vehicle data
interface VehicleData {
  type: string;
  mpg: number;
  description: string;
}

export default function HomeScreen() {
  // Default miles is set to 27 (average commute distance)
  const [miles, setMiles] = useState<string>('27');
  const [mpg, setMpg] = useState<string>('30');
  const [emissions, setEmissions] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('Small Car');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Enhanced vehicle data with descriptions
  const vehicleData: { [key: string]: VehicleData } = {
    'Small Car': {
      type: 'Small Car',
      mpg: 30,
      description: 'Compact or sedan (e.g., Honda Civic, Toyota Corolla)',
    },
    'Large Car': {
      type: 'Large Car',
      mpg: 25,
      description: 'Full-size sedan (e.g., Toyota Camry, Honda Accord)',
    },
    'SUV': {
      type: 'SUV',
      mpg: 20,
      description: 'Sport Utility Vehicle (e.g., Ford Explorer, Honda CR-V)',
    },
    'Truck': {
      type: 'Truck',
      mpg: 15,
      description: 'Pickup truck (e.g., Ford F-150, Toyota Tundra)',
    },
  };

  // Reset emissions when inputs change
  useEffect(() => {
    setEmissions(null);
  }, [miles, mpg, vehicleType]);

  const handleVehicleTypeChange = (selectedType: string) => {
    setVehicleType(selectedType);
    setMpg(String(vehicleData[selectedType].mpg));
  };

  const validateInputs = (): boolean => {
    const milesNum = parseFloat(miles);
    const mpgNum = parseFloat(mpg);

    if (isNaN(milesNum) || milesNum <= 0) {
      Alert.alert(
        'Invalid Mileage',
        'Please enter a valid number of miles greater than 0.'
      );
      return false;
    }

    if (isNaN(mpgNum) || mpgNum <= 0) {
      Alert.alert(
        'Invalid MPG',
        'Please enter a valid MPG value greater than 0.'
      );
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

    setIsCalculating(true);
    Keyboard.dismiss();

    // Simulate calculation time for better UX
    setTimeout(() => {
      const milesNum = parseFloat(miles);
      const mpgNum = parseFloat(mpg);
      const gallonsUsed = milesNum / mpgNum;
      const co2Emissions = gallonsUsed * 8.887;

      setEmissions(co2Emissions.toFixed(2));
      setLastCalculation(new Date());
      setIsCalculating(false);
    }, 800);
  };

  const getEmissionsImpact = (emissions: number): string => {
    if (emissions < 10) return 'Low environmental impact';
    if (emissions < 50) return 'Moderate environmental impact';
    return 'High environmental impact - Consider carpooling or alternative transport';
  };

  // Calculate weekly and yearly emissions and carbon credits
  const tripEmissionsKg = emissions ? parseFloat(emissions) : 0;
  const weeklyEmissionsKg = emissions ? (tripEmissionsKg * 5).toFixed(2) : null;
  const yearlyEmissionKg = emissions ? (tripEmissionsKg * 5 * 52).toFixed(2) : null;
  const yearlyCarbonCredits = emissions
    ? (tripEmissionsKg * 5 * 52 / 1000).toFixed(2)
    : null;

  // Helper function: convert kg to lbs (1 kg = 2.20462 lbs)
  const convertKgToLbs = (kg: number): string => (kg * 2.20462).toFixed(2);

  // Calculate urban trees equivalent:
  // 1 urban tree offsets ~86.17 lbs of CO₂e.
  // Convert yearly emissions from kg to lbs, then divide by 86.17.
  const urbanTrees = emissions
    ? ((parseFloat(yearlyEmissionKg!) * 2.20462) / 86.17).toFixed(0)
    : null;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          🌱 Car Emissions Calculator
        </ThemedText>

        <ThemedText style={styles.description}>
          Calculate your carbon footprint by entering your trip details below.
          Help protect our environment by tracking your CO₂ emissions.
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Distance Traveled</ThemedText>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter miles driven"
              keyboardType="numeric"
              value={miles}
              onChangeText={setMiles}
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => Keyboard.dismiss()}
            >
              <ThemedText style={styles.okButtonText}>OK</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Vehicle Information</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Select Vehicle Type</ThemedText>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen(true)}
            >
              <ThemedText style={styles.dropdownButtonText}>
                {vehicleType}
              </ThemedText>
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
                    <ThemedText style={styles.dropdownTitle}>
                      Select Vehicle Type
                    </ThemedText>
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
                          <ThemedText style={styles.dropdownItemText}>
                            {item.type}
                          </ThemedText>
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
                Only enter if you know your vehicle's exact fuel efficiency
              </ThemedText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={() => calculateEmissions()}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>
              Calculate CO₂ Emissions
            </ThemedText>
          )}
        </TouchableOpacity>

        {emissions !== null && (
          <View style={styles.resultsContainer}>
            <ThemedText style={styles.emissionsResult}>
              Estimated CO₂ Emissions (Trip):
              <ThemedText style={styles.emissionsNumber}>
                {' '}{emissions} kg ({convertKgToLbs(parseFloat(emissions))} lbs)
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.emissionsResult}>
              Estimated Weekly CO₂ Emissions:
              <ThemedText style={styles.emissionsNumber}>
                {' '}{(tripEmissionsKg * 5).toFixed(2)} kg ({convertKgToLbs(tripEmissionsKg * 5)} lbs)
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.emissionsResult}>
              Estimated Yearly CO₂ Emissions:
              <ThemedText style={styles.emissionsNumber}>
                {' '}{yearlyEmissionKg} kg ({convertKgToLbs(parseFloat(yearlyEmissionKg!))} lbs)
              </ThemedText>
            </ThemedText>

            <View style={styles.carbonCreditContainer}>
              <ThemedText style={styles.carbonCreditTitle}>
                Carbon Credit Equivalent
              </ThemedText>
              <ThemedText style={styles.carbonCreditText}>
                One carbon credit is equivalent to 1,000 kg (1 metric ton) of CO₂.
              </ThemedText>
              <ThemedText style={styles.carbonCreditText}>
                Your trip's emissions of{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {emissions} kg
                </ThemedText>{' '}
                represent{' '}
                {(parseFloat(emissions) / 1000 * 100).toFixed(2)}% of a carbon credit.
              </ThemedText>
              <ThemedText style={styles.carbonCreditText}>
                Your estimated yearly trip emissions of{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {yearlyEmissionKg} kg
                </ThemedText>{' '}
                represent{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {yearlyCarbonCredits}
                </ThemedText>{' '}
                carbon credits.
              </ThemedText>
            </View>

            <View style={styles.urbanTreesContainer}>
              <ThemedText style={styles.urbanTreesTitle}>
                Urban Trees Equivalent
              </ThemedText>
              <ThemedText style={styles.urbanTreesText}>
                Your estimated yearly trip emissions of{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {yearlyEmissionKg} kg
                </ThemedText>{' '}
                equals{' '}
                <ThemedText style={styles.emissionsNumber}>
                  {urbanTrees}
                </ThemedText>{' '}
                urban trees.
              </ThemedText>
              <ThemedText style={styles.urbanTreesText}>
                (Conversion: 1 kg = 2.20462 lbs; 1 urban tree offsets ~86.17 lbs of CO₂e)
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.offsetButton}
              onPress={() =>
                Linking.openURL(
                  'https://terrapass.com/product/productindividuals-families/'
                )
              }
            >
              <ThemedText style={styles.offsetButtonText}>
                Purchase Carbon Credits to Offset Your Emissions
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.impactText}>
              {getEmissionsImpact(parseFloat(emissions))}
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
    paddingBottom: 60, // Extra bottom padding for scrolling
  },
  container: {
    padding: 20,
    paddingTop: 40, // Extra top padding to keep title at the top
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
    marginBottom: 20,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 24,
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
    marginBottom: 20,
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
    marginBottom: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
    marginBottom: 100,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  emissionsResult: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emissionsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
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
