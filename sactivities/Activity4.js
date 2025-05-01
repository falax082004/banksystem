import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const App = () => {
  return (
    <View style={mystyles.container}>
           <View style={mystyles.box1}>
            <Text style={mystyles.text1}>Box 1</Text>
           </View>
            <View style={mystyles.box2}>
              <Text style={mystyles.text2}>Box 2</Text>
            </View>
            <View style={mystyles.box3}>
              <Text style={mystyles.text3}>Box 3</Text>
            </View>
    </View>
  )
}

export default App

const mystyles = StyleSheet.create({
container:{
  flex:1,
  justifyContent: 'center',
  alignItems:'center',
  paddingLeft:20,
},

box1:{
  backgroundColor:'green',
  width:'98%',
  height:'33.33%',
  alignItems:'center',
  justifyContent:'center',
  borderWidth:5,
  borderColor:'yellow'
},
box2:{
  backgroundColor:'blue',
  width:'98%',
  height:'33.33%',
  alignItems:'flex-end',
  justifyContent:'center',
  borderWidth:5,
  borderColor:'red',
  paddingRight:20, //spacing
},
box3:{
  backgroundColor:'red',
  width:'98%',
  height:'33.33%',
  alignItems:'flex-start',
  justifyContent:'center',
  borderWidth:5,
  borderColor:'salmon',
  paddingLeft:20,
},
text1:{
  fontSize:100,
  textShadowColor:'black',
  textShadowOffset: {width:2,height:2},
  textShadowRadius:3,
  fontWeight:'bold',
  color:'yellow'
},
text2:{
  fontSize:80,
  textShadowColor:'yellow',
  textShadowOffset:{width:2,height:2},
  textShadowRadius:3,
  fontWeight:'300',
  transform:'lowercase',
  color:'white',
  fontFamily:'Times New Roman',
},
text3:{
  fontSize:60,
  textShadowColor:'yellow',
  fontWeight:'bold',
  fontStyle:'italic',
  color:'white',
  fontFamily:'Arial',
  textTransform:'uppercase',
  textAlign:'left',
},
})
