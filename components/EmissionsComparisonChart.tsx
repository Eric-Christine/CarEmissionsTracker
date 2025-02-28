import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, useColorScheme, LayoutChangeEvent, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Svg, { Rect, Text, Line, G } from 'react-native-svg';

// Define the props for the component
interface EmissionsComparisonChartProps {
  currentEmissions: {
    daily: string | null;
    weekly: string | null;
    yearly: string | null;
  };
  isMetric: boolean;
}

// National average CO₂ emissions from transportation
const nationalAverages = {
  daily: (isMetric: boolean) => isMetric ? 5.8 : 12.8,    // kg or lbs
  yearly: (isMetric: boolean) => isMetric ? 2110 : 4650,  // kg or lbs
};

// Helper function to format numbers with commas
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString('en-US');
};

// Function to determine if device is a large screen (iPad, Mac, etc.)
const isLargeScreen = () => {
  const { width, height } = Dimensions.get('window');
  return Math.max(width, height) >= 768; // iPad mini width is 768
};

const EmissionsComparisonChart: React.FC<EmissionsComparisonChartProps> = ({ 
  currentEmissions, 
  isMetric 
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  
  // Detect if we're on a large screen
  const [largeScreen, setLargeScreen] = useState(isLargeScreen());
  
  // State to hold the actual container width measured from layout
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Handle layout changes to get accurate container width
  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width * 0.95); // Use 95% of the container width for the chart
  };
  
  // Update on orientation change or dimension change
  useEffect(() => {
    const updateLayout = () => {
      setLargeScreen(isLargeScreen());
    };
    
    Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      // Clean up event listener
      const dimensionsHandler = Dimensions.addEventListener('change', () => {});
      dimensionsHandler.remove();
    };
  }, []);
  
  // Theme colors
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
    },
    dark: {
      background: '#121212',
      surface: '#1e1e1e',
      primary: '#90caf9',
      primaryDark: '#64b5f6',
      text: '#e0e0e0',
      textSecondary: '#b0b0b0',
      chartBackground: '#1e1e1e',
      userBarColor: '#2196F3',  // Using a brighter blue for visibility in dark mode
      avgBarColor: '#FFC107',   // Using a brighter yellow for visibility in dark mode
      gridLine: '#333333',
    }
  };

  // Parse emission values to numbers
  const dailyEmission = currentEmissions.daily ? parseFloat(currentEmissions.daily) : 0;
  const yearlyEmission = currentEmissions.yearly ? parseFloat(currentEmissions.yearly) : 0;
  
  // Get national average values
  const avgDaily = nationalAverages.daily(isMetric);
  const avgYearly = nationalAverages.yearly(isMetric);
  
  // Calculate scale for yearly values
  const yearlyScale = 100;
  const scaledYearlyEmission = yearlyEmission / yearlyScale;
  const scaledAvgYearly = avgYearly / yearlyScale;
  
  // Chart dimensions based on container width
  // Using the full containerWidth (which is already scaled to 95% of parent)
  const chartWidth = containerWidth;
  // Aspect ratio based height
  const chartHeight = largeScreen ? Math.min(containerWidth * 0.5, 300) : Math.min(containerWidth * 0.7, 250);
  
  // Dynamic padding based on chart size
  const padding = { 
    top: chartHeight * 0.12, 
    right: chartWidth * 0.05, 
    bottom: chartHeight * 0.15, // Increased bottom padding for axis label
    left: chartWidth * (Platform.OS === 'ios' && !largeScreen ? 0.15 : 0.18) // Increased left padding for axis label
  };
  
  // Calculate max value for Y-axis scaling
  const maxValue = Math.max(
    dailyEmission,
    scaledYearlyEmission,
    avgDaily,
    scaledAvgYearly
  ) * 1.1; // Add 10% margin
  
  // Chart scaling
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  // Bar configuration - now with only 2 categories
  const categories = ['Daily', 'Yearly'];
  const categoryCount = categories.length;
  // Dynamic bar width based on chart size - wider since we only have 2 categories
  const barWidthFactor = largeScreen ? 0.4 : 0.35;
  const barWidth = (innerWidth / categoryCount) * barWidthFactor;
  const barGap = barWidth * 0.3;
  
  // Data points - only daily and yearly now
  const userData = [dailyEmission, scaledYearlyEmission];
  const avgData = [avgDaily, scaledAvgYearly];
  
  // Calculate font sizes based on container width with maximum caps
  const getBaseSize = () => Math.min(Math.max(chartWidth / 40, 6), 14); // Min 6, Max 14
  const fontSizeBase = getBaseSize();
  
  // Cap all font sizes
  const fontSize = {
    axis: Math.min(fontSizeBase * (largeScreen ? 0.9 : 0.8), 12),
    labels: Math.min(fontSizeBase * (largeScreen ? 1.1 : 0.9), 14),
    values: Math.min(fontSizeBase * (largeScreen ? 0.9 : 0.7), 12),
    title: Math.min(fontSizeBase * (largeScreen ? 1.6 : 1.3), 18),
    description: Math.min(fontSizeBase * (largeScreen ? 1.1 : 0.9), 14),
    axisLabels: Math.min(fontSizeBase * 0.9, 12),
  };
  
  // Create grid lines
  const gridLineCount = largeScreen ? 5 : 4;
  const gridLines = Array.from({ length: gridLineCount + 1 }, (_, i) => {
    const y = padding.top + (innerHeight / gridLineCount) * i;
    const value = maxValue - (maxValue / gridLineCount) * i;
    return { y, value };
  });

  const styles = StyleSheet.create({
    container: {
      marginTop: 15,
      marginBottom: 15,
      padding: 8,
      backgroundColor: colors[theme].surface,
      borderRadius: 12,
      width: '100%', // Take full width of parent
      alignItems: 'center', 
    },
    chartTitle: {
      fontSize: fontSize.title,
      fontWeight: 'bold',
      marginBottom: largeScreen ? 8 : 4,
      color: colors[theme].primary,
      textAlign: 'center',
    },
    chartDescription: {
      fontSize: fontSize.description,
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
      width: Math.min(fontSizeBase * (largeScreen ? 1.0 : 0.8), 14),
      height: Math.min(fontSizeBase * (largeScreen ? 1.0 : 0.8), 14),
      borderRadius: Math.min(fontSizeBase * (largeScreen ? 0.5 : 0.4), 7),
      marginRight: 5,
    },
    legendText: {
      fontSize: fontSize.labels,
      color: colors[theme].text,
    },
    noteText: {
      fontSize: fontSize.axis,
      color: colors[theme].textSecondary,
      marginTop: 5,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    yearlyContainer: {
      marginTop: 10,
      padding: 10,
      width: '95%', // Slightly narrower than parent
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 8,
    },
    yearlyTitle: {
      fontSize: Math.min(fontSize.labels * 1.1, 16),
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
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 6,
      flex: 1,
      marginHorizontal: '2%',
    },
    valueLabel: {
      fontSize: fontSize.axis,
      color: colors[theme].textSecondary,
      marginBottom: 2,
    },
    valueText: {
      fontSize: Math.min(fontSize.labels, 14),
      fontWeight: 'bold',
      color: colors[theme].text,
      textAlign: 'center',
    },
    chartWrapper: {
      alignItems: 'center',
      marginVertical: 5,
      width: '100%',
    },
  });

  if (containerWidth === 0) {
    // Return a placeholder view until we measure the container width
    return <View style={styles.container} onLayout={onLayout} />;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ThemedText style={styles.chartTitle}>
        Emissions Comparison
      </ThemedText>
      
      <ThemedText style={styles.chartDescription}>
        See how your transportation emissions compare to the national average
      </ThemedText>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors[theme].userBarColor }]} />
          <ThemedText style={styles.legendText}>Your Emissions</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors[theme].avgBarColor }]} />
          <ThemedText style={styles.legendText}>National Average</ThemedText>
        </View>
      </View>
      
      {/* Custom Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background */}
          <Rect 
            x={0} 
            y={0} 
            width={chartWidth} 
            height={chartHeight} 
            fill={colors[theme].chartBackground} 
            rx={8} 
            ry={8} 
          />
          
          {/* Y-axis label (added at top) */}
          <Text
            x={padding.left / 2}
            y={padding.top / 2 + 5}
            fontSize={fontSize.axisLabels}
            fill={colors[theme].textSecondary}
            textAnchor="middle"
          >
            {isMetric ? 'CO₂ (kg)' : 'CO₂ (lbs)'}
          </Text>
          
          {/* Grid Lines */}
          {gridLines.map((line, index) => (
            <G key={`grid-${index}`}>
              <Line 
                x1={padding.left} 
                y1={line.y} 
                x2={chartWidth - padding.right} 
                y2={line.y} 
                stroke={colors[theme].gridLine} 
                strokeWidth={1} 
                strokeDasharray={index === gridLines.length - 1 ? "0" : "3,3"} 
              />
              <Text 
                x={padding.left - 4} 
                y={line.y + 3} 
                fill={colors[theme].textSecondary} 
                fontSize={fontSize.axis} 
                textAnchor="end"
              >
                {line.value.toFixed(1)}
              </Text>
            </G>
          ))}
          
          {/* X-axis labels */}
          {categories.map((category, index) => {
            const x = padding.left + (innerWidth / categoryCount) * index + (innerWidth / categoryCount) / 2;
            return (
              <Text 
                key={`label-${index}`}
                x={x} 
                y={chartHeight - padding.bottom / 2} 
                fill={colors[theme].text} 
                fontSize={fontSize.labels} 
                textAnchor="middle"
              >
                {category}
              </Text>
            );
          })}
          
          {/* Bars - User Data */}
          {userData.map((value, index) => {
            const x = padding.left + (innerWidth / categoryCount) * index + (innerWidth / categoryCount) / 2 - barWidth - barGap / 2;
            const barHeight = Math.max(1, value / maxValue * innerHeight); // Ensure at least 1px height
            const y = padding.top + innerHeight - barHeight;
            
            // Only show value labels if there's enough space
            const showLabel = barHeight > (fontSize.values * 1.5);
            
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
                    y={y - fontSize.values * 0.3} 
                    fill={colors[theme].text} 
                    fontSize={fontSize.values} 
                    textAnchor="middle"
                  >
                    {index === 1 ? (value * yearlyScale).toFixed(0) : value.toFixed(1)}
                  </Text>
                )}
              </G>
            );
          })}
          
          {/* Bars - National Average */}
          {avgData.map((value, index) => {
            const x = padding.left + (innerWidth / categoryCount) * index + (innerWidth / categoryCount) / 2 + barGap / 2;
            const barHeight = Math.max(1, value / maxValue * innerHeight); // Ensure at least 1px height
            const y = padding.top + innerHeight - barHeight;
            
            // Only show value labels if there's enough space
            const showLabel = barHeight > (fontSize.values * 1.5);
            
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
                    y={y - fontSize.values * 0.3} 
                    fill={colors[theme].text} 
                    fontSize={fontSize.values} 
                    textAnchor="middle"
                  >
                    {index === 1 ? (value * yearlyScale).toFixed(0) : value.toFixed(1)}
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

      {/* Separate display for yearly values since they're scaled in the chart */}
      <View style={styles.yearlyContainer}>
        <ThemedText style={styles.yearlyTitle}>
          Yearly Emissions Comparison (unscaled)
        </ThemedText>
        <View style={styles.yearlyValues}>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueLabel}>Your Emissions</ThemedText>
            <ThemedText style={styles.valueText}>
              {currentEmissions.yearly 
                ? `${formatNumber(currentEmissions.yearly)} ${isMetric ? 'kg' : 'lbs'}`
                : 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueLabel}>National Average</ThemedText>
            <ThemedText style={styles.valueText}>
              {`${formatNumber(nationalAverages.yearly(isMetric))} ${isMetric ? 'kg' : 'lbs'}`}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default EmissionsComparisonChart;