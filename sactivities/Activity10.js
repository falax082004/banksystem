import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import React from 'react';
import Avatar from './assets/balagbag3.jpeg';
import Fontisto from '@expo/vector-icons/Fontisto';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';

const App = () => {
  return (
    <>
      <View style={styles.container}>
        {/* Card Component */}
        <View style={{ flexDirection: 'row' }}>
          <Image source={Avatar} style={styles.avatar} />
          <View style={{ width: 10 }} />
          <Text style={{ fontSize: 18, color: 'white', marginTop: 10 }}>
            Khurt Andrei Garcia
          </Text>
        </View>
        {/* Card Component */}
      </View>

      <ScrollView>
        <View style={{ borderWidth: 5, borderColor: 'red', borderRadius: 10, margin: 10 }}>
          {/* Make sure text is not empty */}
          <Fontisto name="email" size={32} color="green" style={{marginLeft:20}} /> 
          <Text style={styles.justifiedText}>
            
          {'\t\t'}Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  {'\n\n'} {/* Adds space between sections */}
  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  
          
          
          </Text>
        </View>

        <View style={{ height: 2, width: '100%', backgroundColor: 'gray' }} />

        <View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
        <FontAwesome5 name="user-tie" size={28} color="green"  />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Edit Profile</Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray'/>
        </View>

        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>

<View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
       <FontAwesome5 name="wrench" size={24} color="black" />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Setting      </Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray'/>
        </View>
          <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>

<View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
       <AntDesign name="poweroff" size={24} color="black" />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Power Off  </Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray'/>
        </View>





      </ScrollView>
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'gray',
    borderBottomLeftRadius: 15,
    borderBottomEndRadius: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 50,
  },
  justifiedText: {
    textAlign: 'justify', // Justify the text
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
})
