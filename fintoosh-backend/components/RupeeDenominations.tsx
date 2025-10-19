import React from 'react';
import { View, Text } from 'react-native';

const denominations = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

interface RupeeDenominationsProps {
  amount: number;
}

export const RupeeDenominations: React.FC<RupeeDenominationsProps> = ({ amount }) => {
  const calculateDenominations = (total: number) => {
    const result: { [key: number]: number } = {};
    let remaining = total;

    denominations.forEach(denom => {
      if (remaining >= denom) {
        result[denom] = Math.floor(remaining / denom);
        remaining %= denom;
      }
    });

    return result;
  };

  const breakdown = calculateDenominations(amount);

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 5,
      justifyContent: 'center'
    }}>
      {Object.entries(breakdown).map(([denom, count]) => (
        <View key={denom} style={{
          backgroundColor: '#f0f8ff',
          borderRadius: 4,
          padding: 2,
          margin: 1,
          minWidth: 25,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e0e0e0'
        }}>
          <Text style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: '#333'
          }}>
            ₹{denom}×{count}
          </Text>
        </View>
      ))}
    </View>
  );
};
