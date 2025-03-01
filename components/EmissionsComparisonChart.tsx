import React from 'react';
import { View, StyleSheet, useWindowDimensions, useColorScheme, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Svg, { Rect, Text, Line, G } from 'react-native-svg';

interface EmissionsComparisonChartProps {
  currentEmissions: {
    daily: string | null;
    weekly: string | null;
    yearly: string | null;
  };
  isMetric: boolean;
}

const nationalAverages = {
  daily: (isMetric: boolean) => (isMetric ? 6.58 : 14.5), // kg or lbs
  yearly: (isMetric: boolean) => (isMetric ? 2400 : 5291), // kg or lbs
};

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString('en-US');
};

const svgFontSize = {
  axis: 16,
  labels: 16,
  values: 18,
};

// Define theme colors (or import from your theme)
const colors = {
  light: {
    background: '#fff',
    surface: '#f8f9fa',
    primary: '#2196F3',
    primaryDark: '#1976d2',
    text: '#333',
    textSecondary: '#666',
    chartBackground: '#fff',
    userBarColor: '#2196F3',
    avgBarColor: '#FF9800',
    gridLine: '#e0e0e0',
    border: '#ccc',
    inputBackground: '#fff',
    selectedBackground: '#e0f7fa',
    modalOverlay: 'rgba(0,0,0,0.4)',
    success: '#4caf50',
    successLight: '#c8e6c9',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#90caf9',
    primaryDark: '#64b5f6',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    chartBackground: '#1e1e1e',
    userBarColor: '#2196F3',
    avgBarColor: '#FFC107',
    gridLine: '#333333',
    border: '#555',
    inputBackground: '#2c2c2c',
    selectedBackground: '#424242',
    modalOverlay: 'rgba(0,0,0,0.6)',
    success: '#81c784',
    successLight: '#388e3c',
  },
};

const createChartStyles = (theme: 'light' | 'dark', largeScreen: boolean) =>
  StyleSheet.create({
    container: {
      // The padding here should match what you do in other screens
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: colors[theme].surface,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
      overflow: 'hidden', // Hide any slight overflow
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: largeScreen ? 8 : 4,
      color: colors[theme].primary,
      textAlign: 'center',
    },
    chartDescription: {
      fontSize: 16,
      color: colors[theme].textSecondary,
      marginBottom: largeScreen ? 10 : 6,
      textAlign: 'center',
      paddingHorizontal: 5,
    },
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: largeScreen ? 5 : 3,
      flexWrap: 'wrap',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: largeScreen ? '5%' : '4%',
      marginVertical: 2,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 5,
    },
    legendText: {
      fontSize: 16,
      color: colors[theme].text,
    },
    noteText: {
      fontSize: 16,
      color: colors[theme].textSecondary,
      marginTop: 5,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    yearlyContainer: {
      marginTop: 10,
      padding: 10,
      width: '100%',
      backgroundColor:
        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 8,
    },
    yearlyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors[theme].text,
      textAlign: 'center',
      marginBottom: 5,
    },
    yearlyValues: {
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: '2%',
    },
    valueContainer: {
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: '3%',
      backgroundColor:
        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 6,
      flex: 1,
      marginHorizontal: '2%',
    },
    valueLabel: {
      fontSize: 16,
      color: colors[theme].textSecondary,
      marginBottom: 2,
    },
    valueText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors[theme].text,
      textAlign: 'center',
    },
    chartWrapper: {
      width: '100%',
      alignItems: 'center',
      marginVertical: 5,
    },
  });

const EmissionsComparisonChart: React.FC<EmissionsComparisonChartProps> = ({
  currentEmissions,
  isMetric,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const largeScreen = screenWidth >= 768;

  const styles = createChartStyles(theme, largeScreen);

  // Subtract horizontal padding (16 left + 16 right = 32 total)
  const chartWidth = screenWidth - 8;
  // Limit chart height based on ratio and a max
  const chartHeight = largeScreen
    ? Math.min(chartWidth * 0.5, 300)
    : Math.min(chartWidth * 0.7, 250);

  // Padding inside the chart for axis labels, etc.
  const padding = {
    top: chartHeight * 0.18,
    right: chartWidth * 0.05,
    bottom: chartHeight * 0.15,
    // Slightly reduce the left padding so the chart doesn't overflow
    left: chartWidth * (Platform.OS === 'ios' && !largeScreen ? 0.2 : 0.2),
  };

  // Parse emission values
  const dailyEmission = currentEmissions.daily
    ? parseFloat(currentEmissions.daily)
    : 0;
  const yearlyEmission = currentEmissions.yearly
    ? parseFloat(currentEmissions.yearly)
    : 0;

  // National average values and scaling for yearly data
  const avgDaily = nationalAverages.daily(isMetric);
  const avgYearly = nationalAverages.yearly(isMetric);
  const yearlyScale = 100;
  const scaledYearlyEmission = yearlyEmission / yearlyScale;
  const scaledAvgYearly = avgYearly / yearlyScale;

  // Calculate maximum value with a margin for scaling the chart
  const maxValue =
    Math.max(dailyEmission, scaledYearlyEmission, avgDaily, scaledAvgYearly) *
    1.1;

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Categories for the chart (Daily and Yearly)
  const categories = ['Daily', 'Yearly'];
  const categoryCount = categories.length;

  const barWidthFactor = largeScreen ? 0.4 : 0.35;
  const barWidth = (innerWidth / categoryCount) * barWidthFactor;
  const barGap = barWidth * 0.3;

  // Data arrays for user and national average
  const userData = [dailyEmission, scaledYearlyEmission];
  const avgData = [avgDaily, scaledAvgYearly];

  // Create horizontal grid lines for the chart
  const gridLineCount = largeScreen ? 5 : 4;
  const gridLines = Array.from({ length: gridLineCount + 1 }, (_, i) => {
    const y = padding.top + (innerHeight / gridLineCount) * i;
    const value = maxValue - (maxValue / gridLineCount) * i;
    return { y, value };
  });

  return (
    <View style={styles.container}>
      <ThemedText style={styles.chartTitle}>Emissions Comparison</ThemedText>

      <ThemedText style={styles.chartDescription}>
        See how your transportation emissions compare to the national average
      </ThemedText>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: colors[theme].userBarColor },
            ]}
          />
          <ThemedText style={styles.legendText}>Your Emissions</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: colors[theme].avgBarColor },
            ]}
          />
          <ThemedText style={styles.legendText}>National Average</ThemedText>
        </View>
      </View>

      {/* Custom Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Chart background */}
          <Rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            fill={colors[theme].chartBackground}
            rx={8}
            ry={8}
          />
          {/* Y-axis title */}
          <Text
            x={padding.left / 1.1}
            y={padding.top - 20}
            fontSize={svgFontSize.axis}
            fill={colors[theme].textSecondary}
            textAnchor="middle"
          >
            {isMetric ? 'CO₂ (kg)' : 'CO₂ (lbs)'}
          </Text>
          {/* Grid lines and Y-axis values */}
          {gridLines.map((line, index) => (
            <G key={`grid-${index}`}>
              <Line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke={colors[theme].gridLine}
                strokeWidth={1}
                strokeDasharray={index === gridLines.length - 1 ? '0' : '3,3'}
              />
              <Text
                x={padding.left - 4}
                y={line.y + 3}
                fill={colors[theme].textSecondary}
                fontSize={svgFontSize.axis}
                textAnchor="end"
              >
                {line.value.toFixed(1)}
              </Text>
            </G>
          ))}
          {/* X-axis labels */}
          {categories.map((category, index) => {
            const x =
              padding.left +
              (innerWidth / categoryCount) * index +
              (innerWidth / categoryCount) / 2;
            return (
              <Text
                key={`label-${index}`}
                x={x}
                y={chartHeight - padding.bottom / 2}
                fill={colors[theme].text}
                fontSize={svgFontSize.labels}
                textAnchor="middle"
              >
                {category}
              </Text>
            );
          })}
          {/* User Emissions Bars */}
          {userData.map((value, index) => {
            const x =
              padding.left +
              (innerWidth / categoryCount) * index +
              (innerWidth / categoryCount) / 2 -
              barWidth -
              barGap / 2;
            const barHeight = Math.max(1, (value / maxValue) * innerHeight);
            const y = padding.top + innerHeight - barHeight;
            const showLabel = barHeight > svgFontSize.values * 1.5;
            return (
              <G key={`user-bar-${index}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[theme].userBarColor}
                  rx={3}
                  ry={3}
                />
                {showLabel && (
                  <Text
                    x={x + barWidth / 2}
                    y={y - svgFontSize.values * 0.3}
                    fill={colors[theme].text}
                    fontSize={svgFontSize.values}
                    textAnchor="middle"
                  >
                    {index === 1
                      ? (value * yearlyScale).toFixed(0)
                      : value.toFixed(1)}
                  </Text>
                )}
              </G>
            );
          })}
          {/* National Average Bars */}
          {avgData.map((value, index) => {
            const x =
              padding.left +
              (innerWidth / categoryCount) * index +
              (innerWidth / categoryCount) / 2 +
              barGap / 2;
            const barHeight = Math.max(1, (value / maxValue) * innerHeight);
            const y = padding.top + innerHeight - barHeight;
            const showLabel = barHeight > svgFontSize.values * 1.5;
            return (
              <G key={`avg-bar-${index}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[theme].avgBarColor}
                  rx={3}
                  ry={3}
                />
                {showLabel && (
                  <Text
                    x={x + barWidth / 2}
                    y={y - svgFontSize.values * 0.3}
                    fill={colors[theme].text}
                    fontSize={svgFontSize.values}
                    textAnchor="middle"
                  >
                    {index === 1
                      ? (value * yearlyScale).toFixed(0)
                      : value.toFixed(1)}
                  </Text>
                )}
              </G>
            );
          })}
        </Svg>
      </View>

      <ThemedText style={styles.noteText}>
        *Yearly values are scaled down by {yearlyScale}x to fit on the chart
      </ThemedText>

      {/* Yearly Emissions Comparison */}
      <View style={styles.yearlyContainer}>
        <ThemedText style={styles.yearlyTitle}>
          Yearly Emissions Comparison
        </ThemedText>
        <View style={styles.yearlyValues}>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueLabel}>Your Emissions</ThemedText>
            <ThemedText style={styles.valueText}>
              {currentEmissions.yearly
                ? `${formatNumber(currentEmissions.yearly)} ${
                    isMetric ? 'kg' : 'lbs'
                  }`
                : 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueLabel}>National Average</ThemedText>
            <ThemedText style={styles.valueText}>
              {`${formatNumber(nationalAverages.yearly(isMetric))} ${
                isMetric ? 'kg' : 'lbs'
              }`}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default EmissionsComparisonChart;
