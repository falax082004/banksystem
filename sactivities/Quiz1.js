import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <View style={mystyles.container}>
      <View style={mystyles.box1}>
        <Text style={mystyles.text1}>FOREST</Text>
      </View>
      <View style={mystyles.box2}>
        <Text style={mystyles.text2}>OCEAN</Text>
      </View>
      <View style={mystyles.box3}>
        <Text style={mystyles.text3}>Passion</Text>
      </View>
      <View style={mystyles.box4}>
        <Text style={mystyles.text4}>Sunshine</Text>
      </View>
      <View style={mystyles.box5}>
        <Text style={mystyles.text5}>Lavender</Text>
      </View>
    </View>
  );
};

export default App;

const mystyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box1: {
    backgroundColor: 'green',
    width: '98%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'green',
  },
  box2: {
    backgroundColor: 'blue',
    width: '98%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'blue',
    paddingRight: 20, //spacing
  },
  box3: {
    backgroundColor: 'red',
    width: '98%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'red',
    paddingLeft: 20,
  },
  box4: {
    backgroundColor: 'yellow',
    width: '98%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'yellow',
  },
  box5: {
    backgroundColor: 'purple',
    width: '98%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'purple',
  },
  text1: {
    fontSize: 50, color: 'white', textShadowColor: 'red',  fontWeight: 'bold',textAlign: 'center',fontStyle: 'italic', fontFamily:
'Times New Roman'
  },
  text2: {
    fontSize: 60, fontWeight: 'normal', fontStyle: 'italic', textShadowColor: 'blue',
color: 'yellow', textAlign: 'right', fontFamily: 'Courier New',
  },
  text3: {
    fontSize: 70, textShadowColor: 'red', textAlign: 'center', color: 'white',
fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'Georgia', textTransform: 'uppercase',
  },
  text4: {
    fontSize: 80, textShadowColor: 'orange', fontWeight: 'bold', color: 'black',
textAlign: 'center', fontFamily: 'Verdana', textTransform: 'lowercase',
  },
  text5: {
    fontSize: 60, textShadowColor: 'purple', fontWeight: 'bold',textAlign: 'right', fontStyle: 'italic',
    color: 'pink', fontFamily: 'Arial', textTransform: 'capitalize',
  },
});
