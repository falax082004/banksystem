import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Portrait of a Woman</Text>
      <Image
        source={{ uri: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/941ce253-eb45-4c96-b53a-d7a2e0daa485/dftsani-ec2f8dc3-64bf-4b3e-8375-3005b9cc9694.png/v1/fit/w_828,h_828/ambatukam_nextbot_by_srkiko599_dftsani-414w-2x.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MzQ2NCIsInBhdGgiOiJcL2ZcLzk0MWNlMjUzLWViNDUtNGM5Ni1iNTNhLWQ3YTJlMGRhYTQ4NVwvZGZ0c2FuaS1lYzJmOGRjMy02NGJmLTRiM2UtODM3NS0zMDA1YjljYzk2OTQucG5nIiwid2lkdGgiOiI8PTM0NjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.22a7tec9QDJL1y0C4hp6vmvZeTYyyfBWJ96OjZyvcH4' }}
        style={styles.image}
      />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
  },
});
