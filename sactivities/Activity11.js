import { StyleSheet, Text, View,Image,ScrollView, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import Avatar from './assets/balagbag2.jpeg'
import Fontisto from '@expo/vector-icons/Fontisto';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';

const App = () => {

  const handleSignOut = () => {
    Alert.alert("Working","Signing Out Success!")
  }

  return (
    <>
    <View style={styles.container}>
      {/*Card Components*/}
      <View style={{flexDirection:'row'}}>
        <Image source={Avatar} style={styles.avatar}/>
        <View style={{width:20}}/>
        <Text style={{fontSize:18, color:'white',marginTop:20}}>Khurt Andrei Garcia</Text>
      </View>
      {/*Card Components*/}
      
    </View>

    <ScrollView>
       
        <View style={{borderWidth:5,borderColor:'gray',borderRadius:10,margin:10}}>
        <Fontisto name="email" size={32} color="green" style={{marginLeft:20}} />
          <Text style={styles.text2}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.  
           Ut aliquet tristique diam, at mollis elit sollicitudin sed.   
          orci luctus et ultrices posuere cubilia curae; Donec tristique id lacus eget mattis. 
         
          </Text>
        </View>

     
        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>
       
        
        <View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
        <FontAwesome5 name="user-tie" size={28} color="green"  />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Edit Profile</Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray'/>
        </View>

        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>

        <View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
        <FontAwesome name="wrench" size={24} color="green" />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Edit Profile</Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray' />
        </View>

        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>



        <TouchableOpacity 
          
          style={{flexDirection:'row',marginLeft:20,marginTop:5}}
            onPress={handleSignOut}
        >
        <AntDesign name="poweroff" size={24} color="green" />
        <Text style={{fontSize:16, margin:4,fongWeight:'bold'}}>Settings</Text>
        <View style={{width:'50%'}}/>
        <FontAwesome5 name="chevron-right" size={30} color='gray' />
        </TouchableOpacity>

        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>

      </ScrollView>    
    </>
  )
}

export default App

const styles = StyleSheet.create({
container:{
  width:'100%',
  height:200,
  justifyContent: 'center',
  alignItems:'center',
  backgroundColor:'green',
  borderBottomLeftRadius:15,
  borderBottomEndRadius:15
},
avatar:{
    width:125,
    height:175,
    resizeMode:'cover',
    borderRadius:50
},
text2:{
  marginLeft:20,
  marginTop:5,
  fontSize:15,
  textAlign:'justify',
  
}
})
