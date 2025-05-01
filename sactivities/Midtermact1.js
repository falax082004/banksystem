import React from 'react';
import { Button, Alert, View, StyleSheet } from 'react-native';

const App = () => {
  return (
    <View style={styles.container}>
      <Button
        title="Press Me"
        onPress={() => Alert.alert('Button Pressed')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;